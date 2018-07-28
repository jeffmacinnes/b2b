""" Tool to simulate the Pyneal side of interactions with the remote
webserver controlling the task

"""
import tty
import sys
import termios

import random
import time

import atexit
import numpy as np

import urllib.request


TR = 1

taskHost = 'http://127.0.0.1'
#taskHost = 'http://ec2-54-236-226-138.compute-1.amazonaws.com'
taskPort = 8080
taskBaseURL = '{}:{}'.format(taskHost, taskPort)
print(taskBaseURL)



# def connectToServer():
#     # connect to task server
#     url = '{}/senderConnect'.format(taskBaseURL)
#     print('connecting to: {}'.format(url))
#     urllib.request.urlopen(url)
#
# def disconnectFromServer():
#     urllib.request.urlopen('{}/senderDisconnect'.format(taskBaseURL))
# atexit.register(disconnectFromServer)


def sendToNodeServer(msg):
    url = '{}/{}'.format(taskBaseURL, msg)
    print('sending to node server: /{}'.format(msg))
    print(url)
    urllib.request.urlopen(url)


# establish connection to task server
# connectToServer()

# time.sleep(.5)
# print('sending openMouth')
# sendToNodeServer('openMouth')
#
# time.sleep(.5)
# print('sending closeMouth')
# sendToNodeServer('closeMouth')


# set up a list defining each timept in the run
TR = 2
activeDur = 8
restDur = 2
nReps = 4
activeTrial = ['active'] * int((activeDur/TR))
restTrial = ['rest'] * int((restDur/TR))
trialStructure = (activeTrial + restTrial) * 4

cmd = 'openMouth'
a = input('press any key to start')
for trial in trialStructure:
    if trial == 'active':
        # choose command at random, simulating the classifier output
        shouldOpen = random.randint(0,1)
        if cmd == 'openMouth':
            cmd = 'closeMouth'
        elif cmd == 'closeMouth':
            cmd = 'openMouth'

        print('sending cmd: {}'.format(cmd))
        sendToNodeServer(cmd)
    else:
        print('rest trial, nothing sent')

    time.sleep(TR)

# print('Press ESC to quit...')
# orig_settings = termios.tcgetattr(sys.stdin)
#
# tty.setraw(sys.stdin)
# x = 0
# while x != chr(27): # ESC
#     x=sys.stdin.read(1)[0]
#     if x == 'o':
#         sendToNodeServer('openMouth')
#     elif x == 'c':
#         sendToNodeServer('closeMouth')
#     elif x == 't':
#         sendToNodeServer('catchBug')
#
#
# termios.tcsetattr(sys.stdin, termios.TCSADRAIN, orig_settings)
