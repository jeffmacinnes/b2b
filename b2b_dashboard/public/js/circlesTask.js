var socket;
var socketPort;
var host = '127.0.0.1';
//var host = 'warm-river-88108.herokuapp.com';
var threshBar;
var senderConnection;


function setup() {
    createCanvas(600, 600);
    frameRate(25);
    console.log('sketch running');

    // set up socket streaming
    socket = io.connect(window.location.origin)
    socket.on('senderProb', updateSenderProb);
    socket.on('senderConnected', senderConnected);
    socket.on('senderDisconnected', senderDisconnected);

    // create instance of sender connection indicator
    senderConnection = new SenderConnection(100, 40);

    // create instance of threshBar object
    threshBar = new ThresholdTherm(100, 200);

    // set mode for drawing primitives
    rectMode(CENTER);
    ellipseMode(CENTER);
}


// handle incoming socket data
function updateSenderProb(data){
    console.log('sketch got: ' + data.volIdx + ', ' + data.prob)
    threshBar.updateProb(data.volIdx, data.prob);
}

function senderConnected(){
    console.log('sender connected to the site!');
    senderConnection.updateSenderConnection(true);
}

function senderDisconnected(){
    console.log('sender disconnected from site');
    threshBar.updateProb(0, 0);
    console.log('now here')
    senderConnection.updateSenderConnection(false);
}

function draw(){
    background(100);

    senderConnection.display();
    threshBar.display();
}


function SenderConnection(x, y){
    // object representing the indicator for when the sender connects
    this.centerX = x;
    this.centerY = y;
    this.ellipseCenterX = this.centerX - 50;
    this.textCornerX = this.centerX - 30;
    this.senderConnected = false;

    this.updateSenderConnection = function(connectionStatus) {
        // update the status of the connection to the sender
        if (connectionStatus) {
            this.senderConnected = true;
        } else if (!connectionStatus) {
            this.senderConnected = false;
        }
    }

    this.display = function(){
        stroke(0);
        textAlign(LEFT, CENTER);
        textSize(14);
        if (this.senderConnected) {
            fill(234, 131, 11);
            ellipse(this.ellipseCenterX, this.centerY, 15, 15);
            fill(255);
            text('SENDER connected', this.textCornerX, this.centerY)
        } else {
            fill(200);
            ellipse(this.ellipseCenterX, this.centerY, 15, 15);
            fill(255);
            text('SENDER disconnected', this.textCornerX, this.centerY)
        }
    }
}


function ThresholdTherm(x, y){
    // object representing the threshold thermometer bar
    // initialize location and size of thermometer frame
    this.centerX = x;
    this.centerY = y;
    this.width = 15;
    this.height = 250;
    // coords for lower left corner
    this.cornerX = this.centerX-(this.width/2);
    this.cornerY = this.centerY+(this.height/2);

    // init prob variable
    this.prob = 0;
    this.volIdx = 0;

    this.updateProb = function(newVolIdx, newProb) {
        // update the probability
        this.volIdx = newVolIdx;
        this.prob = newProb*100;
        console.log('got here')
    }

    this.display = function(){
        noStroke();

        // draw the therm rect
        fill(255);
        rect(this.centerX, this.centerY, this.width, this.height);

        // draw halfway line
        fill(255, 12, 132);
        rect(this.centerX, this.centerY, this.width+20, 3);

        // draw the probability indicator
        this.probY = map(this.prob, 0, 100, this.cornerY, this.cornerY - this.height)
        fill(234, 131, 11);
        ellipse(this.centerX, this.probY, 20, 20);

        // draw the volIdx text
        fill(255);
        textSize(24);
        textAlign(CENTER, CENTER);
        text('vol: '+ this.volIdx, this.centerX, this.cornerY+40)
    }

}
