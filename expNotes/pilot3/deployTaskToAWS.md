## Steps for launching task on AWS

* log in to [AWS](https://aws.amazon.com)
	* username: jeff.macinnes@gmail.com
	* password: Same, not John, plus 11

* Confirm there is an EC2 instance running and note the Public DNS address

* Use CyberDuck to transfer over whatever files are necessary to the AWS instance

* Open a terminal window and `ssh` to the EC2 instance 
	* `aws` alias
	* Or, if alias not set up, `ssh -i ~/.ssh/b2b_keyPair.pem ec2-user@54.236.226.138`
		* Note of course that that address needs to match the address of the current EC2 instance. 

* Navigate to: `~/b2b_tasks/chameleon`

### If starting from scratch...
* Type `screen` to start a persistent session
* Type `node nodeserver.js` to start the node server running
* Detach the screen by typing `[ctrl]-a d`
* you can close the window and or logout if you want

### Resume a previous session
* Reattach to the screen by typing `screen -r`
	* If only one current session, this will bring you to it. If multiple sessions, this will pull up a screen with options to choose the session you want. 


## Accessing the task

* open a browser and go to [http://ec2-54-236-226-138.compute-1.amazonaws.com:8080/task.html](http://ec2-54-236-226-138.compute-1.amazonaws.com:8080/task.html)