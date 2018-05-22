"""
Tool to simulate the remote server, listening for triggers from pyneal during
a brain-to-brain experiment.

The server will be listening on a zmq socket. Each time a trigger message is
received, it will send a reply confirming it got the message and then send a
trigger signal out the serial port to the magstim TMS device.
"""
import sys
import os
import time
import atexit
from threading import Thread

import zmq
import serial


### TMS Server Info

context = zmq.Context()
socketHost = '127.0.0.1' # get from settingsThatWork.txt
socketPort = 6666
serialPort = '/dev/tty.usbmodem1421'

class TMSServer(Thread):
    """
    TMS Server class. This object is designed to run on a background thread
    listening for trigger messages from Pyneal. Whenever a trigger message
    is received, it will send a pulse out the serial def
    """
    def __init__(self, socketHost='127.0.0.1', socketPort=6666, serialPort=''):
        # Start the thread upon creation
        Thread.__init__(self)
        self.alive = True

        # Set up socket
        context = zmq.Context()
        self.socket = context.socket(zmq.REP)
        self.socket.bind("tcp://{}:{}".format(socketHost, socketPort))

        # Set up serial port
        self.serialPort = serial.Serial(serialPort, 9600)

        # atexit function, kill thread
        atexit.register(self.kill)

    def run(self):
        while self.alive:
            # listen for new messages
            msg = self.socket.recv_string()
            print('TMS server got message: {}'.format(msg))

            # write to the serial port
            self.triggerSerial()

            # send reply to socket client
            self.socket.send_string('got it')

    def triggerSerial(self):
        """
        send a trigger down the serial port
        """
        # write a '1' to the serial port
        self.serialPort.write('1'.encode('utf-8'))

        # get response from serial port
        #print('resp from serial port: ' + str(self.serialPort.readline()))

    def kill(self):
        self.alive = False



class PynealSim():
    """
    For testing purposes, this class will send open a socket connection
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

# # define the socket using the context
# serverSocket = context.socket(zmq.REP)
# serverSocket.bind("tcp://{}:{}".format(host, port))
#
# # set up serial port parameters
# ser = serial.Serial('/dev/tty.usbmodem14141', 9600)
#
# while True:
#     message = serverSocket.recv()
#     print('server got message: {}'.format(message))
#
#     # write to the serial port
#     ser.write('1'.encode('utf-8'));
#
#     # read response from serial port
#     print('resp from arduino: ' + str(ser.readline()))
#
#     # send reply to client
#     serverSocket.send_string('got it')



if __name__ == '__main__':
    # Start the TMS server
    TMS_server = TMSServer(socketHost = socketHost,
                            socketPort = socketPort,
                            serialPort = serialPort)
    TMS_server.daemon = True
    TMS_server.start()


    # for testing
    pynealSim = PynealSim(socketHost, socketPort)
    volIdx = 0
    while True:
        a = input('press any key to send trigger...')
        pynealSim.sendTrigger(volIdx)
        volIdx += 1
