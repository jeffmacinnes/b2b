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

import numpy as np

import zmq


# TMS Server Info
host = # get from settingsThatWork
port = 6666

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
    def __init__(self, mask_img):
        """
        Everything in the __init__ class will be executed BEFORE the scan begins
        """
        # local reference to MASK from Pyneal setup GUI
        self.mask = mask_img

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
        # Create a socket to communicate with the remote TMS server
        context = zmq.Context()
        self.TMS_socket = context.socket(zmq.REQ)
        self.TMS_socket.connect('tcp:{}:{}'.format(host, port))
        self.logger.info('Analysis script connected to remote TMS server')

        # Load classifier

        # Create an empty ndarray to store all of the samples. (nFeatures x nSamples)

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

        # add it to the master array

        # detrend all voxels in the master array

        # classifiy

        # get probability from classifier


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
