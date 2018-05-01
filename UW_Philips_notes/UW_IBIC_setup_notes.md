# Steps for settings up Pyneal at IBIC

### Plug in yellow ethernet cord

### Open network settings

1. turn off wifi, probably
2. select the ethernet option, and set the configuration to 'Manual'
3. Enter the following:

	* IP address: `192.168.2.130`
	* subnet mask: `255.255.255.0`
	* Router:	`192.168.2.1`


4. Mount the XTC output drive

	* Open connect-to-server dialog box (Finder > Go > Connect to Server, or cmd+k)
	*  server address: `smb://192.168.2.128`
	*  username: `loggrabber`
	*  password:	`philips1`

5. Mount the `X` drive

6. Point pyneal_scanner to the X drive in the `scannerConfig.yaml` file