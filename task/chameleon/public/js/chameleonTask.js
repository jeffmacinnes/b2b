// script config vars
var fr;    // framerate
var socket;
var socketPort;
var host = '127.0.0.1';
//var host = 'warm-river-88108.herokuapp.com';

// task vars
var trialDur = 8000;  // trial dur in ms
var taskState = 'goTrial';

// bgVars
var BG_yOff;

// lizard vars
var lizardImg
var lizardSkinLight = '#f0edcf';
var lizardSkinDark = '#d6d3ab';
var eyeCenter = {x: 257, y: 300};
var eyeRadius = 9;

// bug vars
var bgBugs = []
var nBgBugs = 50;
var goBug;
var noGoBug;

// classes
var senderConnection;
var lizardEye

/**
 * Main P5 js functions. These will set up the initial environment and then
 * call the Draw() function on every screen cycle
 */

function preload(){
    lizardImg = loadImage('stimuli/drawing_small.png');
}

function setup() {
    createCanvas(800, 600);

    // set offset value for BG noise
    BG_yOff = random(0,100);

    // set up socket streaming
    socket = io.connect(window.location.origin)
    socket.on('senderProb', updateSenderProb);
    socket.on('senderConnected', senderConnected);
    socket.on('senderDisconnected', senderDisconnected);

    // create instance of sender connection indicator
    senderConnection = new SenderConnection(100, 40);

    // create instances of sketch objects
    lizardEye = new LizardEye(eyeCenter.x, eyeCenter.y, eyeRadius);
    goBug = new TrialBug('go');
    noGoBug = new TrialBug('noGo');
    for (var i=0; i<=nBgBugs; i++){
        bgBugs.push(new BgBug());
    }


    // set mode for drawing primitives
    rectMode(CORNER);
    ellipseMode(RADIUS);
}

function draw(){
    fr = frameRate();

    // draw background
    drawBackground()

    // update/draw gnats
    for (var i=0; i<bgBugs.length; i++){
        bgBugs[i].update();
        bgBugs[i].display();
    }

    // draw lizard
    image(lizardImg, 0, 0);

    // draw task state
    if (taskState == 'goTrial'){
        // update position of trial bug
        goBug.update()
        goBug.display()

        // update lizard eyes to follow
        bugPos = goBug.getPos();
        lizardEye.update(bugPos.x, bugPos.y);
    } else {
        lizardEye.update(eyeCenter.x, eyeCenter.y);
    }

    // draw the lizard eye
    lizardEye.display();

}



/**
 * Classes and functions to control various aspects of the task
 */
function drawBackground(){
    background(175,243,218);
    noStroke();
    fill(148,218,152);
    var x = 0;
    var c = 0;
    while (x<=width){
        var thisY = noise(BG_yOff+c)*400 + height/2;
        rect(x, thisY, 20, height-thisY);
        x += 20;
        c += .04;
    }
}

function TrialBug(trialType){
    // bugs lizard should eat or not eat depending on trial type
    this.trialType = trialType;
    if (this.trialType == 'go'){
        this.bugColor = color(0, 255, 0);
    } else if (this.trialType == 'noGo'){
        this.bugColor = color(255, 0, 0);
    }

    // initial config vars
    this.trialStarted = false;
    this.trialSt = 0;
    this.x = 0;
    this.y = 0;
    this.yOff = random(0,10)

    // calculate how far to move on each frame
    this.xStepDist = width/(trialDur/1000*60);

    this.update = function(){
        // start trial if necessary
        if (this.trialStarted != true){
            this.startTrial()
        }

        // update position
        this.x -= this.xStepDist;
        this.yOff += .06;
        this.y += (noise(this.yOff)-.5)*10;  // flutters in the y-dim

        console.log(millis()-this.trialSt);
    }

    this.display = function(){
        fill(this.bugColor);
        stroke(100);
        ellipse(this.x, this.y, 10);
    }

    this.startTrial = function(){
        // set starting position of the bug
        this.x = width;
        this.y = random(.1*height, .8*height);

        // record start time
        this.trialSt = millis();
        this.trialStarted = true;
    }

    this.getPos = function(){
        return {x: this.x, y: this.y};
    }


}

function LizardEye(x,y,r){
    // object representing the lizards eye
    this.eyeCenter = {x: x, y: y};
    this.eyeRadius = r;
    this.angle = 0;

    // ring 1 parameters
    this.ring1_center = {x: x, y: y};
    this.ring1_radius = .85*r;
    this.ring1_maxDist = this.eyeRadius-this.ring1_radius;

    // ring 2 parameters
    this.ring2_center = {x: x, y: y};
    this.ring2_radius = .55*r;
    this.ring2_maxDist = this.eyeRadius-this.ring2_radius;

    // pupil parameters
    this.pupil_center = {x: x, y: y};
    this.pupil_radius = .3*r;
    this.pupil_maxDist = this.eyeRadius-this.pupil_radius;

    this.update = function(x,y){
        // rotation angle between target and eye
        this.angle = atan2(y - this.eyeCenter.y,
                           x - this.eyeCenter.x);

        // update the distances of each eye component
        this.ring1_dist = constrain(dist(x, y, this.eyeCenter.x, this.eyeCenter.y),
                                    -this.ring1_maxDist,
                                    this.ring1_maxDist);
        this.ring2_dist = constrain(dist(x, y, this.eyeCenter.x, this.eyeCenter.y),
                                    -this.ring2_maxDist,
                                    this.ring2_maxDist);
        this.pupil_dist = constrain(dist(x, y, this.eyeCenter.x, this.eyeCenter.y),
                                    -this.pupil_maxDist,
                                    this.pupil_maxDist);
    }

    this.display = function(){
        push();
        translate(this.eyeCenter.x, this.eyeCenter.y);

        // eye background
        noStroke();
        fill(190,190,144);
        ellipse(0, 0, this.eyeRadius);

        // draw rings------------
        rotate(this.angle);
        stroke(100);
        fill(190,190,144);
        ellipse(this.ring1_dist, 0, this.ring1_radius);

        fill(253,209,5);
        ellipse(this.ring2_dist, 0, this.ring2_radius);

        // draw pupil
        noStroke();
        fill(0);
        ellipse(this.pupil_dist, 0, this.pupil_radius);

        pop();

    }
}


function BgBug(){
    // object representing background bug
    this.x = random(width)
    this.xOff = random(0,10)
    this.y = random(height)
    this.yOff = random(0,10)
    this.r = random(2,6)
    this.speed = random(1,3)

    this.update = function(){
        this.xOff += 0.01;
        var mx = noise(this.xOff)*2
        this.x += random(-mx, mx);
        this.yOff += 0.01;
        var my = noise(this.yOff)*2
        this.y += random(-my, my);
    }

    this.display = function(){
        noStroke();
        fill(120, 50);
        ellipse(this.x, this.y, this.r);
    }
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



/**
 * Functions to handle socket messages bewteen the client and the
 * server. Throughout the task, the webserver will emit messages to all
 * connected clients, and these functions are responsible for reading
 * those messages and updating the task behavior accordingly
 */
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
