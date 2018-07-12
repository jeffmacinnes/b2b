""" Tool to simulate the Pyneal side of interactions with the remote
webserver controlling the task

"""
import random
import time

import atexit
import numpy as np

import urllib.request


TR = 1

taskHost = '127.0.0.1'
taskPort = 8080
taskBaseURL = 'http://{}:{}'.format(taskHost, taskPort)
print(taskBaseURL)


def connectToServer():
    # connect to task server
    url = '{}/senderConnect'.format(taskBaseURL)
    print('connecting to: {}'.format(url))
    print(url)
    urllib.request.urlopen(url)

def disconnectFromServer():
    urllib.request.urlopen('{}/senderDisconnect'.format(taskBaseURL))
atexit.register(disconnectFromServer)


def sendProbToDashboard(volIdx, prob):
    url = '{}/addProb/{}/{:.3f}'.format(taskBaseURL, volIdx, prob)
    urllib.request.urlopen(url)


# establish connection to task server
connectToServer()


probSequence = np.append(np.zeros(5) + .07,
                         np.ones(5) - .07)
volIdx = 0
i = 0
while True:
    sendProbToDashboard(volIdx, probSequence[i])

    volIdx += 1
    i += 1
    if i == probSequence.shape[0]:
        i = 0

    time.sleep(TR)
