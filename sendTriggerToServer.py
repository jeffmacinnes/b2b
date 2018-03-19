"""
Tool to send a trigger message to a remote server over a ZMQ socket.

This is to simulate and test a component of the custom analyis script for pyneal,
in which the pyneal computer will send a trigger message to a remote server that
is connected to the magstim TMS device. Upon receiving the trigger message, the
remote server will send a direct signal to the TMS device via the serial port.
"""

import zmq
import sys
import select


host = # get from settingsTheWork file
port = 6666

# create an instance of the socket
context = zmq.Context()
socket = context.socket(zmq.REQ)
socket.connect('tcp://{}:{}'.format(host, port))
print('client connected to remote server')

# Send a trigger to the server each time the Return key is pressed
while True:
    while sys.stdin in select.select([sys.stdin], [], [], 0)[0]:
        line = sys.stdin.readline()
        if line:
            msg = 'trigger!'
            socket.send_string(msg)
            print('trigger sent')

            # get replay
            serverResp = socket.recv_string()
            print('server response: {}'.format(serverResp))
