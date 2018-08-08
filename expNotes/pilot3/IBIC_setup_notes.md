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

	* Also update `../b2b/pilotScans/pilot3_real/pyneal_b2b_customAnalysis.py` with this same address

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

1. Start MPRAGE immediately after task completes

2. Meanwhile, build a Nifti version of fullRun by typing:  `python3 getSeries.py`

3. Confirm that the TR of the output nifti is set to 2sec and voxel size is correct. If not, use `fsledithd [NIFTIFILE] emacs` to edit. 

4. Once MPRAGE completes, copy the localizer and the antomical image to `../b2b/pilotScans/pilot3_real`

5. run `createMask.py` with the following inputs:

	* **4D FUNC**: *localizer run*
	* **Check** *Whole Brain FUNC mask*
	* **Check** *Transform MNI mask to FUNC*
	* **hi-res ANAT**: *MPRAGE, non-skull stripped* (however, if this looks shitty, re-run and skull strip first using center of gravity option in BET set at posterior commissure)
	* **MNI Standard**: *MNI151_T1_2mm_brain*
	* **MNI Mask**: *../b2b/data/motor_imager_association-test_z_FDR_0.01.nii.gz*
	* **Output Prefix:** motorImagery_neuroSynth

6. Confirm with `fsleyes` pop up that everything looks good (especially the `hires_FUNC` background image


### Train classifier

1. Run the script to train the classifier

`python3 classifyLocalizer.py [fullRun Nifti File] [mask file]`

* *Make sure to choose the binarized version of the mask!*

* The results from **pilot 2** suggested that training the classifier using the `fullRunLabels` and a SVM C=1 parameter yielded the best results for this subject and mask combo. Hopefully these same settings work well in this case. 

* The output of this script will report the mean classification accuracy across a 5-fold cross validation. The trained classifier will be saved as `pilot3_classifier.pkl`

## Real-time runs

### Scan parameters
* TR: 2sec
* slice dims: 64 x 64
* number of slices: 30
* nTimepts: set at 110 (scanner will prepend with 2 add'l dummy scans)
* total time: 224 sec; 3min 44sec (incl dummy scans)

### Prep task

* On task computer, navigate browser to [http://ec2-54-236-226-138.compute-1.amazonaws.com:8080/task.html](http://ec2-54-236-226-138.compute-1.amazonaws.com:8080/task.html)
 
* Check in as `Sender`. Talk to folks at Guthrie to see how its going. Make sure they access the task site and check in as `receiver`

* update **run number** to appropriate one

* Remind subj of task instructions before beginning
	* Purple flies: Eat (motor imagery)
	* Red flies: Avoid (rest)

### Prep Pyneal

* Before launching **Pyneal**, modify the `../b2b/pilotScans/pilot3_real/pyneal_b2b_customAnalysis.py` to reflect the settings for this session:
	* modify `host` to match the `IPv4` address at Guthrie
	* modify `maskFile` to match the binarzed version of the neuroSynth-based mask created above
	* make sure the `classifierName` is set to an existing file
	* modify `dashboardHost` to reflect the AWS site  


* Launch `Pyneal` with following settings:
	* **Mask**: select the whole brain mask from before
	* **# of timepts**: 110
	* **Analysis**: custom, load `../b2b/pilotScans/pilot3_real/pyneal_b2b_customAnalysis.py`


### Cleanup

* At end of everything, copy all files from mounted X: drive for this subject 
