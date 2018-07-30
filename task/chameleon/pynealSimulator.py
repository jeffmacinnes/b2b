""" Tool to simulate the Pyneal side of interactions with the remote
webserver controlling the task

"""
import sys
import os
import atexit
import random
import time

import zmq
import numpy as np
import urllib.request

## TMS server configuration vars
socketHost = '10.19.84.82'
socketPort = 6666

## webRoute configuration vars
taskHost = 'http://127.0.0.1'
#taskHost = 'http://ec2-54-236-226-138.compute-1.amazonaws.com'
taskPort = 8080
taskBaseURL = '{}:{}'.format(taskHost, taskPort)
print(taskBaseURL)

## Simulated task settings
TR = 2
dummyDur = 4
activeDur = 8
restDur = 2
nReps = 6
dummyScans = ['dummy'] * int((dummyDur/TR))
activeTrial = ['active'] * int((activeDur/TR))
restTrial = ['rest'] * int((restDur/TR))
trialStructure = dummyScans + ((activeTrial + restTrial) * 4)
print(trialStructure
)

class PynealSim():
    """
    For testing purposes, this class will  open a socket connection
    to the TMS server and send phony trigger messages
    """
    def __init__(self, host, port):
        context = zmq.Context()
        self.TMS_socket = context.socket(zmq.REQ)
        self.TMS_socket.connect("tcp://{}:{}".format(host, port))
        self.TMS_socket.send_string('hello from pyneal simulator')
        resp = self.TMS_socket.recv_string()
        print(resp)

    def sendTrigger(self, volIdx):
        """
        Send a trigger to the TMS server, stamped with the current volume index
        """
        # send trigger string
        self.TMS_socket.send_string('trigger - volIdx: {}'.format(volIdx))

        # get response string
        resp = self.TMS_socket.recv_string()
        print('pyneal simulator received: {}'.format(resp))


def sendToNodeServer(msg):
    # send the desired message to the node server via a webroute
    url = '{}/{}'.format(taskBaseURL, msg)
    print('sending to node server: {}'.format(url))
    urllib.request.urlopen(url)


# object to send triggers to the TMS server
#pynealSim = PynealSim(socketHost, socketPort)


tmptCounter = 0
a = input('press ENTER to start task')
for i,trial in enumerate(trialStructure):
    print('timpt {}: trialType: {}'.format(i, trial))
    if trial == 'active':
        # Each ACTIVE trial, send closeMouth -> openMouth -> openMouth/TMS trigger
        # This way, for every ACTIVE trial, it should trigger on the 3rd timept (6sec)
        if tmptCounter == 0:
            sendToNodeServer('closeMouth')
        elif tmptCounter == 1:
            sendToNodeServer('openMouth')
        elif tmptCounter == 2:
            sendToNodeServer('openMouth')

            # send trigger to TMS
            pynealSim.sendTrigger(i)
            print('sent trigger to TMS; timept: {}'.format(i))

        # increment counter
        tmptCounter += 1

    elif trial == 'rest':
        # reset counter
        tmptCounter = 0

    time.sleep(TR)
