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
serialPort = '/dev/tty.usbmodem1411'  # for osx, arduino port
#serialPort = 'COM19'   # for windows, arduino port

class TMSServer(Thread):
    """
    TMS Server class. This object is designed to run on a background thread
    listening for trigger messages from Pyneal. Whenever a trigger message
    is received, it will send a pulse out the serial def
    """
    def __init__(self, socketHost='127.0.0.1', socketPort=6666, serialPort='', triggerType='serial', tms_intensity=50):
        # Start the thread upon creation
        Thread.__init__(self)
        self.alive = True

        # Set up socket
        context = zmq.Context()
        self.socket = context.socket(zmq.REP)
        self.socket.bind("tcp://*:%s" % socketPort)

        # Set up serial port if needed
        self.triggerType = triggerType
        if self.triggerType == 'serial':
            self.serialPort = serial.Serial(serialPort, 9600)
        elif self.triggerType == 'TMS':
            from CCDLUtil.MagStimRapid2Interface.ArmAndFire import TMS

            # init TMS machine
            self.tms = TMS()
            self.tms.tms_arm()
            self.tms_intensity = tms_intensity
        else:
            print("I don't recognize your triggerType variable: {}".format(triggerType))

        # # atexit function, kill thread
        atexit.register(self.kill)

    def run(self):
        while self.alive:
            # listen for new messages
            msg = self.socket.recv()
            print(msg)

            # send the appropriate trigger
            if self.triggerType == 'serial':
                self.triggerSerial()
            elif self.triggerType == 'TMS':
                self.triggerTMS()
            else:
                print('no trigger device set up!')

            # send reply to socket client
            self.socket.send('got it')

    def triggerSerial(self):
        """
        send a trigger down the serial port
        """
        # write a '1' to the serial port
        self.serialPort.write('1'.encode('utf-8'))

        # get response from serial port
        #print('resp from serial port: ' + str(self.serialPort.readline()))

    def triggerTMS(self):
        ### fire TMS ###
        self.tms.tms_fire(i=self.tms_intensity, sleep_time=0.5)

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


if __name__ == '__main__':
    # Start the TMS server
    TMS_server = TMSServer(socketHost = socketHost,
                            socketPort = socketPort,
                            serialPort = serialPort,
                            triggerType = 'serial')
    TMS_server.daemon = True
    TMS_server.start()

    # for testing
    # pynealSim = PynealSim(socketHost, socketPort)
    # volIdx = 0
    while True:
        pass
        # a = raw_input('press any key to send trigger...')
        # pynealSim.sendTrigger(volIdx)
        # volIdx += 1
