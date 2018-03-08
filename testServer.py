"""
Tool to simulate the remote server, listening for triggers from pyneal during
a brain-to-brain experiment.

The server will be listening on a zmq socket. Each time a trigger message is
received, it will send a reply confirming it got the message and then send a
trigger signal out the serial port to the magstim TMS device.
"""

import zmq
import serial

context = zmq.Context()
port = 6666

# define the socket using the context
serverSocket = context.socket(zmq.REP)
serverSocket.bind("tcp://127.0.0.1:{}".format(port))


while True:
    message = serverSocket.recv()
    print('server got message: {}'.format(message))
    serverSocket.send_string('got it')
