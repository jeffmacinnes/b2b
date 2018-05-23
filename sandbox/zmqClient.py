#from __future__ import print_function

import zmq
import sys

port = "8888"
if len(sys.argv) > 1:
    port =  sys.argv[1]
    int(port)

if len(sys.argv) > 2:
    port1 =  sys.argv[2]
    int(port1)

context = zmq.Context()
print("Connecting to server...")
socket = context.socket(zmq.REQ)
socket.connect("tcp://10.19.101.32:%s" % port)
if len(sys.argv) > 2:
    socket.connect("tcp://10.19.101.32:%s" % port1)

# message = socket.recv()
# print(message)
# print('connected!')

#  Do 10 requests, waiting each time for a response
for request in range (1,10):
    print("Sending request ", request,"...")
    socket.send_string("Hello")
    #  Get the reply.
    message = socket.recv_string()
    print("Received reply ", request, "[", message, "]")
