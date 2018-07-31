# Notes
## Computer setup

### Connect laptop to IBIC LAN

1. Plut in ethernet USB adapter and plug yellow CAT cable into adapter. 

### Configure network settings

1. select the ethernet option, and set the configuration to 'Manual'
2. Enter the following:

	* IP address: `192.168.2.130`
	* subnet mask: `255.255.255.0`
	* Router:	`192.168.2.1`


3. Mount the XTC output drive

	* Open connect-to-server dialog box (Finder > Go > Connect to Server, or cmd+k)
	*  server address: `smb://192.168.2.128`
	*  username: `loggrabber`
	*  password:	`philips1`

4. Mount the `X` drive

5. Point pyneal_scanner to the X drive in the `scannerConfig.yaml` file

### Test Wi-Fi connectivity to Guthrie

1. Talk to Guthrie folks to get the **IPv4 address** that they got once plugging in the wi-fi USB card and connecting to UW wi-fi network. 

2. Update `../b2b/TMS_server/sendTrigger2Server.py` to change the `socketHost` address to match the new `IPv4` address up in Guthrie. 

3. Confirm with Guthrie folks that they are ready to send a test trigger. Once confirmed run `python3 sendTrigger2Server.py`.
	* If this works, you should see `pyneal simulator received: got it`. But confirm with Guthrie that a TMS pulse was emitted as well. 


## Classifier Training


### Scan parameters:

* TR: 2sec
* slice dims: 64 x 64
* number of slices: 30
* nTimepts: set at 132 (scanner will prepend with 2 add'l dummy scans)

### Task parameters:

* dummy scans (4s) + pre task (4s) + task (256 s) + post task (4s)
	* total duration: 268 sec; 4 min 28 sec
* trial order: `rest` -> `active` (8 repetitions)
	* **rest**: white square
	* **active**: green circle (imagine finger tap)
* each trial: 16sec. 

### Run the task

1. Navigate browser to [http://ec2-54-236-226-138.compute-1.amazonaws.com:8080/classifierTraining.html](http://ec2-54-236-226-138.compute-1.amazonaws.com:8080/classifierTraining.html)

2. Click `start` button simultaneously with the scan beginning


### Prep input data and mask for the classifier

1. Run MPRAGE immediately after task completes?

2. Meanwhile, build a Nifti version of fullRun by typing:  `python3 getSeries.py`

3. Confirm that the TR of the output nifti is set to 2sec and voxel size is correct. If not, use 

`fsledithd [NIFTIFILE] emacs` 

to edit. 

**NEXT STEPS DEPEND ON HOW THE CLASSIFIER FEATURES WILL BE DEFINED (ANATOMICAL vs FUNCTIONAL MASK).**

### Train classifier

1. Run the script to train the classifier

`python3 classifyLocalizer.py [fullRun Nifti File] [mask file]`
