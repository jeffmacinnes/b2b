# Pilot Scan #2
6/27/2018


## Steps for running task
### Scanner Settings

* TR: 2s
* slice dims: 64 x 64
* 30 slices
* nTimepts: 
	* full run: 132 + 2 dummy scans -> (268 sec; 4 min 28 sec)
	* short run: 68 + 2 dummy scans -> (140 sec; 2 min 20 sec)

## Steps for testing remote triggers to Guthrie

A goal of this scan is to confirm that we can send remote triggers to the TMS server in Guthrie via the UW wi-fi network while simultaneously hooked up to the IBIC private LAN

### Set up in Guthrie
* PC login: Tmsbrainstim1010*
* Path to script dir: `C:/Users/Experimenter/b2b/TMS_server`
* Port #: `6666`

1. Confirm the **USB WI-FI** adapter is plugged into the PC, and we are connected to the university wi-fi network. If not, connect by clicking on the wi-fi icon in the bottom right hand of the screen
2. Open a terminal and type: `ipconfig` to get the IPv4 address assigned to the `Wireless LAN adapter Wireless Network Connection`. Record this address and share with the folks on the fMRI side, as this is the address that **Pyneal** will use to send triggers to. 
3. Confirm that the Arduino is plugged into the USB on the PC and get the COM port number. (Start Menu -> Devices and Printers). 
4. Open `TMS_server.py` in text editor and confirm that correct COM/serial port is assigned (around line 23). 
5. From the terminal, type: `python TMS_server.py` to start the server listening, and confirm that it prints the correct port number to stdOut. 

### Set up on IBIC side
For a quick and dirty test, navigate to `.../b2b/TMS_server` and open up `sendTrigger2Server.py` in a text editor. 

1. Confirm that the `socketHost` matches the **IPv4 address** obtained in step 2 above. Also confirm that the `socketPort` matches the socketPort that `TMS_server.py` is listenining on in Guthrie. 

2. from the terminal, type: `python3 sendTrigger2Server.py`. This prompt you to press any key to send a trigger to the TMS_server

3. If this works, you should see `pyneal simulator received: got it` everytime you press the key. This indicated that you send a trigger message to the TMS_server, and the TMS_server responded. 
