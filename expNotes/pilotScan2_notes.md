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

	
1. Connect laptop to IBIC LAN
2. Collect the FULL RUN functional run first (using **finger tapping** vs rest)

3. Use `getSeries.py` to build a nifti version of the run. Confirm that the TR of the output nifti is set to 2sec and voxel size is correct. If not use:

`fsledithd [NIFTIFILE] emacs`

4. Start the MPRAGE. While that is going, run GLM on first run....

### Run GLM on first run

1. Open FEAT, load `fullRunGLM.fsf` template file
2. Load the nifti from the first run into FEAT
3. Hit Submit (should take ~1min). Output saved at `firstLevel.feat`

### Build 5mm sphere mask around peak

1. Get the coordinates for peak voxel from GLM:

`fslstats firstLevel+.feat/stats/zstat1.nii.gz -x`

output: 28 31 26

2. Build a 5mm sphere mask around point

`fslmaths firstLevel+.feat/example_func.nii.gz -mul 0 -add 1 -roi 28 1 31 1 26 1 0 1 tmpPoint -odt float`

`fslmaths tmpPoint.nii.gz -kernel sphere 5 -fmean -bin 5mm_sphereMask_FUNC -odt float`

`rm tmpPoint.nii.gz`

### Train classifier on first run

1. Run script to train classifier

`python3 classifyLocalizer.py [fullRun Nifti File] 5mm_sphereMask_FUNC.nii.gz`

This will print the classification accuracy to the screen, as well as save the classifier at: `pilot2_classifier.pkl`

NOTE: Classifier accuracy w/ 5mm sphere mask was only 55% (std. 11.38%), so we tried classifying using the whole brain mask (`firstLevel+.feat/mask.nii.gz') instead and got 66% accuracy (19% stdev). Better, so we used it, but still less than anticipated


### Set up Pyneal, load custom Analysis script

1. In Pyneal, load the custom analysis script at:

`.../b2b/pynealAnalysis/pilot2/pyneal_b2b_customAnalysis.py`

This file has the classifier and mask file already hardcoded. Doesn't matter when mask you select in GUI. 

2. Make sure the heroko dashboard is running locally on `127.0.0.1:8080`


### Monitor via dashboard
locally: [http://127.0.0.1:8080/](http://127.0.0.1:8080/)

heroku: [https://warm-river-88108.herokuapp.com/](https://warm-river-88108.herokuapp.com/)

## Steps for testing remote triggers to Guthrie [WORKS!!!]

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
