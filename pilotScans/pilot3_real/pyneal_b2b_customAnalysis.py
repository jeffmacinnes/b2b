"""
Analysis script to be run with Pyneal during B2B experiment.

At setup, this script will open a socket connection to the TMS machine (which
is running a server listening for responses).

During the scan, if certain conditions are met, this script will send a trigger
to the remote TMS machine, which will in turn fire the TMS pulse

Preparation for each scan:
    - need to specify the path to the correct pickled classifier file. This
    classifier should have been trained using previous data for the current
    subject and the exact same mask as will be used during real-time run.
"""
import sys
import os
from os.path import join
import logging
import pickle
from threading import Thread
import atexit
import time

import numpy as np
import nibabel as nib
import urllib.request

import zmq


# TMS Server Info
host = '127.0.0.1' # get from settingsThatWork
#host = '10.19.15.206'
port = 6666
classifierName = 'pilot3_classifier.pkl'
maskFile = 'motor_imagery_neuroSynth_FUNC_mask.nii.gz'
weightMask = False
numTimepts = 110

#taskHost = '127.0.0.1'
taskHost = 'http://ec2-54-236-226-138.compute-1.amazonaws.com'
taskPort = 8080
taskBaseURL = '{}:{}'.format(taskHost, taskPort)

### Hardcoded Task Settings
TR = 2
preTaskDur = 4         # note: does NOT include 2 dummy vols at start
activeDur = 10
restDur = 8
nReps = 12
preTask= ['preTask'] * int((preTaskDur/TR))
activeTrials = ['Active'] * int((activeDur/TR))
restTrials = ['Rest'] * int((restDur/TR))
trialOrder = preTask + ((activeTrials + restTrials) * nReps)


class CustomAnalysis:
    """
    This is a custom analysis script for use with Pyneal that is designed for
    the brain-2-brain project. The goal of this custom script will be to:
        - establish a connection to a remote TMS server
        - load a classifier that has been previously trained on a localizer run
            from the current subject
        - once the scan begins, each new timept will be masked to isolate the
            desired voxels, detrended, and then classified. If the output of the
            classifier surpasses some threshold, a trigger will be sent to the
            remote TMS server
    """
    def __init__(self, maskFile, weightMask, numTimepts):
        """
        Everything in the __init__ method will be executed BEFORE the scan
        begins. This is a place to run any necessary setup code.

        The __init__ method provides you with the following inputs from the
        setup GUI:
            - maskFile: path to the mask specified in the GUI
            - weightMask: True/False flag for if "weight mask?" was checked
            - numTimepts: number of timepts in run, as specified in GUI

        You can use or ignore these inputs as needed for your analysis.
        """
        # Load masks and weights, and create an within-class reference to
        # each for use in later methods.
        mask_img = nib.load(maskFile)
        if weightMask == True:
            self.weights = mask_img.get_data().copy()
        self.mask = mask_img.get_data() > 0  # 3D boolean array of mask voxels

        # within-class reference to numTimepts for use in later methods
        self.numTimepts = numTimepts

        # Add the directory that this script lives in to the path. This way it
        # is easy to load any additional files you want to put in the same
        # directory as your custom analysis script
        self.customAnalysisDir = os.path.abspath(os.path.dirname(__file__))
        sys.path.append(self.customAnalysisDir)

        # Import the logger. If desired, you can write log messages to the
        # Pyneal log file using:
        # self.logger.info('my log message') - log file and stdOut
        # self.logger.debug('my log message') - log file only
        self.logger = logging.getLogger('PynealLog')

        ########################################################################
        ############# vvv INSERT USER-SPECIFIED CODE BELOW vvv #################
        # Load classifier
        with open(join(self.customAnalysisDir, classifierName), 'rb') as f:
            self.clf = pickle.load(f)

        # get the index location of the "motor" class from within the classifier
        self.clf_motorIdx = np.where(self.clf.classes_ == 'Active')[0][0]

        # Create a socket to communicate with the remote TMS server
        context = zmq.Context()
        self.TMS_socket = context.socket(zmq.REQ)
        self.logger.info('Analysis script waiting to connect to remote TMS server at {}:{}'.format(host, port))
        self.TMS_socket.connect("tcp://{}:{}".format(host, port))
        self.TMS_socket.send_string('hello from analysis script')
        self.TMS_socket.recv_string()
        self.logger.info('Analysis script connected to remote TMS server')

        # Create an empty ndarray to store all of the samples. (nSamples x nFeatures)
        nVoxelsInMask = sum(self.mask.ravel())
        self.masterArray = np.zeros(shape=(self.numTimepts, nVoxelsInMask))

        # Task parameters
        self.activeVolClassifications = [''] * len(trialOrder)
        self.thisTrialTriggered = False
        self.minTriggerDelay = 8
        self.timeOfLastTrigger = 0

        ############# ^^^ END USER-SPECIFIED CODE ^^^ ##########################
        ########################################################################

    def compute(self, volume, volIdx):
        """
        Code that will be executed on EACH new 3D volume that arrives DURING the
        real-time scan. Results must be returned in a dictionary. No restrictions
        on dict key names or values, but note that the volume index will get added
        automatically by Pyneal before the result gets placed on the results
        server, so no need to specify that here
        """
        ########################################################################
        ############# vvv INSERT USER-SPECIFIED CODE BELOW vvv #################
        # mask the volume to isolate the voxels of interest, add these voxels
        # to the master array at this timept location
        self.masterArray[volIdx, :] = volume[self.mask]

        # standardize all voxel timeseries up to the current volume
        cleaned_array = self.standardizeTimeseries(self.masterArray[:volIdx+1, :])

        # grab the current sample, reshape to (1, nFeatures)
        thisSample = cleaned_array[volIdx, :].reshape(1, cleaned_array.shape[1])

        # classify, and get the probability that this sample is a 'motor' sample
        predictedClass = self.clf.predict(thisSample)[0]
        motorProb = self.clf.predict_proba(thisSample)[self.clf_motorIdx][0]
        self.logger.info('volIdx {} - activeProb: {}'.format(volIdx, motorProb))

        ### Task and triggering logic
        thisVolType = trialOrder[volIdx]
        # print(thisVolType + ', predicted ' + predictedClass)
        if thisVolType == 'Active':
            # store the predicted class for this active trial volume
            self.activeVolClassifications[volIdx] = predictedClass

            # if a trigger has not been sent on this trial yet
            if self.thisTrialTriggered == False:
                # send open/close mouth
                if predictedClass == 'Active':
                    self.sendToTaskWebServer('openMouth', volIdx)

                    # if the previous volume was ALSO Active
                    # print(self.activeVolClassifications[volIdx-1])
                    if self.activeVolClassifications[volIdx-1] == 'Active':
                        print('previous trial was Active')

                        # if enough time has passed between triggers
                        if (time.time()-self.timeOfLastTrigger) >= self.minTriggerDelay:
                            self.sendTrigger(volIdx)

                            # update timeSinceLastTrigger
                            self.timeOfLastTrigger = time.time()

                            # set flag
                            self.thisTrialTriggered = True
                else:
                    self.sendToTaskWebServer('closeMouth', volIdx)

        elif thisVolType == 'Rest':
            # Currently a rest vol, but if previous vol was Active, reset flags
            if trialOrder[volIdx-1] == 'Active':
                self.thisTrialTriggered = False

        ############# ^^^ END USER-SPECIFIED CODE ^^^ ##########################
        ########################################################################

        return {'predictedClass': predictedClass, 'motorProb': motorProb}

    def standardizeTimeseries(self, signals):
        """
        'signals' expected to be a 2D array of timeseries with time on the first
        axis (rows) and voxels on the second axis (columns). This method will
        mean center each voxel, and set the variance to 1.

        returns a standardized array of the same dimensions

        Note: these calculations taken from 'clean' method from signal.py in
        the nilearn packagage:
        https://github.com/nilearn/nilearn/blob/master/nilearn/signal.py
        """
        signals = signals - signals.mean(axis=0)   # remove mean
        std = np.sqrt((signals**2).sum(axis=0))
        std[std < np.finfo(np.float).eps] = 1.  # avoids numerical problems
        signals /= std    # divide every value in signals by the std
        signals *= np.sqrt(signals.shape[0])  # set unit variance (i.e. 1)

        return signals

    def sendTrigger(self, volIdx):
        """
        Send a trigger to the TMS server, stamped with the current volume index
        """
        print('sent trigger!')
        self.TMS_socket.send_string('trigger - volIdx: {}'.format(volIdx))
        self.logger.info('trigger sent to TMS server - volIdx: {}'.format(volIdx))

        resp = self.TMS_socket.recv_string()
        self.logger.info('received TMS server response: {}'.format(resp))

    def sendToTaskWebServer(self, msg, volIdx):
        """
        Send the desired command to the task webserver via webroute
        """
        url = '{}/{}'.format(taskBaseURL, msg)
        self.logger.info('sent {} to task web server, volIdx: {}'.format(msg, volIdx))
        urllib.request.urlopen(url)


class TMS_serverSim(Thread):
    """
    for testing purposes, simulate the TMS server that the custom analysis
    script can connect to
    """
    def __init__(self, port, host='127.0.0.1'):
        # start the thread upon creation
        Thread.__init__(self)

        context = zmq.Context()
        self.socket = context.socket(zmq.REP)
        self.socket.bind("tcp://{}:{}".format(host, port))
        self.alive = True
        print('TMS server alive and listening')

        # atexit function, kill at shutdown
        atexit.register(self.killServer)

    def run(self):
        while self.alive:
            # listen for new messages
            msg = self.socket.recv_string()
            print('TMS server received: {}'.format(msg))

            # send reply
            self.socket.send_string('from TMS server: received msg - {}'.format(msg))

    def killServer(self):
        """
        close connection to dashboard (if running), and kill the server
        """
        self.alive = False



### FOR TESTING:
if __name__ == '__main__':

    # start the test TMS server
    # TMS_server = TMS_serverSim(port)
    # TMS_server.daemon = True
    # TMS_server.start()

    # read in the mask
    mask_img = nib.load(maskFile)

    # create instance of the custom analysis class
    customAnalysis = CustomAnalysis(maskFile, weightMask, numTimepts)

    # Load test data
    test_fmri = nib.load('../pilot2_offline/func_0003.nii.gz').get_data()
    nTimepts = test_fmri.shape[3]


    # loop over all timepts, and run compute method on each
    a = input('press any key to begin...')
    probs = []
    print('volume: ', end =' ', flush=True)
    for volIdx in range(nTimepts):
        thisResult = customAnalysis.compute(test_fmri[:,:,:,volIdx], volIdx)
        probs.append(thisResult['motorProb'])
        # pause
        print(volIdx, end=', ', flush=True)
        time.sleep(2);


    print(probs)
