var socket;
var host = '127.0.0.1';
var socketPort = '8000';
var threshBar;
var taskStarted = false;

function setup() {
    createCanvas(600, 400);
    frameRate(25);
    console.log('sketch running');

    // set up socket streaming
    socket = io.connect('http://' + host + ':' + socketPort);
    socket.on('senderProb', updateSenderProb);
    socket.on('pynealConnected', pynealConnected);

    // create instance of threshBar object
    threshBar = new ThresholdTherm(100, 200);
    console.log(threshBar.height);

    // set mode for drawing primitives
    rectMode(CENTER);
    ellipseMode(CENTER);
    textAlign(CENTER, CENTER);
}

// handle incoming socket data
function updateSenderProb(data){
    console.log('sketch got: ' + data.volIdx + ', ' + data.prob)
    threshBar.updateProb(data.volIdx, data.prob);
}

function pynealConnected(){
    console.log('pyneal connected to the site!');
    taskStarted = true;
}

function draw(){
    background(100);
    if (taskStarted == true){
        threshBar.display;
    } else {
        drawStartScreen();
    }
}

function drawStartScreen(){
    fill(255, 0, 0);
    ellipse(200, 200, 50, 50);
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
    }

    this.display = function(){
        console.log('heresfsd');
        // draw the therm rect
        fill(255);
        rect(this.centerX, this.centerY, this.width, this.height);

        // draw halfway line
        fill(255, 12, 132);
        rect(this.centerX, this.centerY, this.width+20, 3);

        // draw the probability indicator
        this.probY = map(this.prob, 0, 100, this.cornerY, this.cornerY - this.height)
        fill(234, 131, 11);
        noStroke();
        ellipse(this.centerX, this.probY, 20, 20);

        // draw the volIdx text
        fill(255);
        textSize(24);
        text('vol: '+ this.volIdx, this.centerX, this.cornerY+40)
    }

}
