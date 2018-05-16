"""
Analysis script to be run with Pyneal during B2B experiment.

At setup, this script will open a socket connection to the TMS machine (which
is running a server listening for responses).

During the scan, if certain conditions are met, this script will send a trigger
to the remote TMS machine, which will in turn fire the TMS pulse
"""
import sys
import os
from os.path import join
import logging
import pickle
from threading import Thread
import atexit

import numpy as np
import nibabel as nib
from nilearn.input_data import NiftiMasker


import zmq


# TMS Server Info
host = '127.0.0.1' # get from settingsThatWork
port = 5555
classifierName = 'pyneal_002_classifier.pkl'
maskFile = './pyneal_002_motorSphere_5mm_mask.nii.gz'
weightMask = False
numTimepts = 186

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

        # Create a socket to communicate with the remote TMS server
        context = zmq.Context()
        self.TMS_socket = context.socket(zmq.REQ)
        self.TMS_socket.connect("tcp://{}:{}".format(host, port))
        self.TMS_socket.send_string('hello from analysis script')
        print(self.TMS_socket.recv_string())
        self.logger.info('Analysis script connected to remote TMS server')

        # Create an empty ndarray to store all of the samples. (nFeatures x nSamples)
        nVoxelsInMask = int(sum(self.mask.ravel()))
        self.masterArray = np.zeros(shape=(nVoxelsInMask, self.numTimepts))

        # create a flattened 1D version of mask
        self.maskFlat = self.mask.ravel()

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
        # mask the input volume
        maskedVol =


        # mask volume and add to the master array
        self.masterArray

        # detrend all voxels in the master array

        # classifiy

        # get probability from classifier

        # send trigger if desired


        self.triggered = False

        # Check if conditions are correct to trigger TMS
        if self.triggerTMS(volume):
            self.TMS_socket.send_string('trigger')
            self.logger.info('trigger sent to TMS server')
            self.triggered = True

            resp = self.TMS_socket.recv_string()
            self.logger.info('received TMS server response: {}'.format(resp))


        ############# ^^^ END USER-SPECIFIED CODE ^^^ ##########################
        ########################################################################

        return {'triggered': self.triggered}



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
            print('TMS server: {}'.format(msg))

            # send reply
            self.socket.send_string('from TMS server: received msg - {}'.format(msg))

    def killServer(self):
        self.alive = False


### For testing:
if __name__ == '__main__':

    # start the test TMS server
    TMS_server = TMS_serverSim(host, port)
    TMS_server.daemon = True
    TMS_server.start()

    # read in the mask
    mask_img = nib.load(maskFile)

    # create instance of the custom analysis class
    test = CustomAnalysis(maskFile, weightMask, numTimepts)
