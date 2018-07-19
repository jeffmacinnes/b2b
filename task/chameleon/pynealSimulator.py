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

#taskHost = '127.0.0.1'
taskHost = 'http://ec2-54-236-226-138.compute-1.amazonaws.com'
taskPort = 8080
taskBaseURL = '{}:{}'.format(taskHost, taskPort)
print(taskBaseURL)



def connectToServer():
    # connect to task server
    url = '{}/senderConnect'.format(taskBaseURL)
    print('connecting to: {}'.format(url))
    urllib.request.urlopen(url)

def disconnectFromServer():
    urllib.request.urlopen('{}/senderDisconnect'.format(taskBaseURL))
atexit.register(disconnectFromServer)


def sendToNodeServer(msg):
    url = '{}/{}'.format(taskBaseURL, msg)
    print('sending to node server: /{}'.format(msg))
    urllib.request.urlopen(url)


# establish connection to task server
connectToServer()

time.sleep(.5)
print('sending openMouth')
sendToNodeServer('openMouth')

time.sleep(.5)
print('sending closeMouth')
sendToNodeServer('closeMouth')

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
