
import zmq

socketHost = '10.18.223.190'
socketPort = 6666


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
    # for testing
    pynealSim = PynealSim(socketHost, socketPort)
    volIdx = 0
    while True:
        a = input('press any key to send trigger...')
        pynealSim.sendTrigger(volIdx)
        volIdx += 1
