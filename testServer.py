"""
Tool to simulate the remote server, listening for triggers from pyneal during
a brain-to-brain experiment.

The server will be listening on a zmq socket. Each time a trigger message is
received, it will send a reply confirming it got the message and then send a
trigger signal out the serial port to the magstim TMS device.
"""

import zmq
import serial
import time

context = zmq.Context()
host = '192.168.0.4' # ip address of server computer
host = '173.250.196.123'  # ip of office comp
port = 6666

# define the socket using the context
serverSocket = context.socket(zmq.REP)
serverSocket.bind("tcp://{}:{}".format(host, port))

# set up serial port parameters
#ser = serial.Serial('/dev/tty.usbmodem14141', 9600)

while True:
    message = serverSocket.recv()
    print('server got message: {}'.format(message))

    # write to the serial port
    #ser.write('1'.encode('utf-8'));

    # read response from serial port
    #print('resp from arduino: ' + str(ser.readline()))

    # send reply to client
    serverSocket.send_string('got it')
