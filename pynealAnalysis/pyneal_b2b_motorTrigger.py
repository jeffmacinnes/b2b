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
port = 5555
classifierName = 'pyneal_002_motor-vs-rest_classifier.pkl'
maskFile = './pyneal_002_motorSphere_5mm_mask.nii.gz'
weightMask = False
numTimepts = 186

dashboardHost = '127.0.0.1'
dashboardPort = 8000
dashboardBaseURL = 'http://{}:{}'.format(dashboardHost, dashboardPort)


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
        self.clf_motorIdx = np.where(self.clf.classes_ == 'motor')[0][0]

        # Create a socket to communicate with the remote TMS server
        context = zmq.Context()
        self.TMS_socket = context.socket(zmq.REQ)
        self.TMS_socket.connect("tcp://{}:{}".format(host, port))
        self.TMS_socket.send_string('hello from analysis script')
        print(self.TMS_socket.recv_string())
        self.logger.info('Analysis script connected to remote TMS server')

        # set up dashboard communication
        self.dashboard = True
        self.connectToDashboard()
        atexit.register(self.disconnectFromDashboard)

        # Create an empty ndarray to store all of the samples. (nSamples x nFeatures)
        nVoxelsInMask = sum(self.mask.ravel())
        self.masterArray = np.zeros(shape=(self.numTimepts, nVoxelsInMask))

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
        self.logger.info('volIdx {} - motorProb: {}'.format(volIdx, motorProb))

        # send this probability to the dashboard
        self.updateDashboard(volIdx, motorProb)

        # send trigger if desired
        if motorProb > .5:
            self.sendTrigger(volIdx)

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
        self.TMS_socket.send_string('trigger - volIdx: {}'.format(volIdx))
        self.logger.info('trigger sent to TMS server - volIdx: {}'.format(volIdx))

        resp = self.TMS_socket.recv_string()
        self.logger.info('received TMS server response: {}'.format(resp))

    def updateDashboard(self, volIdx, prob):
        """
        If dashboard is running, send the probability value for this volume to
        the dashboard server
        """
        if self.dashboard:
            # format the url for sending this value to the dashboard
            url = '{}/addProb/{}/{:.3f}'.format(dashboardBaseURL, volIdx, prob)
            urllib.request.urlopen(url)

    def connectToDashboard(self):
        """
        connect to the dashboard server
        """
        urllib.request.urlopen('{}/senderConnect'.format(dashboardBaseURL))

    def disconnectFromDashboard(self):
        """
        function to send disconnect message to the dashboard
        """
        # send senderDisconnect message to dashboard
        urllib.request.urlopen('{}/senderDisconnect'.format(dashboardBaseURL))



class TMS_serverSim(Thread):
    """
    for testing purposes, simulate the TMS server that the custom analysis
    script can connect to
    """
    def __init__(self, host, port):
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
    TMS_server = TMS_serverSim(host, port)
    TMS_server.daemon = True
    TMS_server.start()

    # read in the mask
    mask_img = nib.load(maskFile)

    # create instance of the custom analysis class
    customAnalysis = CustomAnalysis(maskFile, weightMask, numTimepts)

    # Load test data
    test_fmri = nib.load('../data/subject001/pyneal_002/receivedFunc.nii.gz').get_data()
    nTimepts = test_fmri.shape[3]


    # loop over all timepts, and run compute method on each
    a = input('press any key to begin...')
    probs = []
    for volIdx in range(nTimepts):
        thisResult = customAnalysis.compute(test_fmri[:,:,:,volIdx], volIdx)
        probs.append(thisResult['motorProb'])
        # pause
        time.sleep(.2);

    print(probs)
