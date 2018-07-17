// script config vars
var fr = 25;    // framerate
var socket;
var socketPort;
var host = '127.0.0.1';
//var host = 'warm-river-88108.herokuapp.com';

// task vars
var trialDur = 8000;  // trial dur in ms
var taskState;
var taskSt;
var trialNum = 0;
var trialOrder = ['goTrial', 'noGoTrial',
                    'goTrial', 'noGoTrial']; //, 'goTrial', 'noGoTrial'];
var taskStarted = false;
var restSt;
var goScore = 0;
var noGoScore = 0;

// bgVars
var BG_yOff;

// lizard vars
var lizardImg;
var mouthOpenImg;
var mouthClosedImg;
var mouthIsOpen = false;
var showTongue = false;
var lizardSkinLight = '#f0edcf';
var lizardSkinDark = '#d6d3ab';
var eyeCenter = {x: 257, y: 300};
var eyeRadius = 9;

// bug vars
var bgBugs = []
var nBgBugs = 50;
var goColor = '#AD81FE';
var noGoColor = '#DD5044';

// classes
var lizardBody;
var senderConnection;
var lizardEye;

/**
 * Main P5 js functions. These will set up the initial environment and then
 * call the Draw() function on every screen cycle
 */
function preload(){
    lizardImg = loadImage('stimuli/drawing_small.png');
    mouthOpenImg = loadImage('stimuli/mouthOpen_small.png');
    mouthClosedImg = loadImage('stimuli/mouthClosed_small.png');
}

function setup() {
    createCanvas(800, 600);
    frameRate(fr);

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
    lizardBody = new LizardBody(lizardImg, mouthOpenImg, mouthClosedImg);
    lizardEye = new LizardEye(eyeCenter.x, eyeCenter.y, eyeRadius);
    trialBug = new TrialBug();
    for (var i=0; i<=nBgBugs; i++){
        bgBugs.push(new BgBug());
    }

    // set mode for drawing primitives
    rectMode(CORNER);
    ellipseMode(RADIUS);
}

function draw(){

    if (taskStarted == false){
        startTask();
    }

    // draw background
    drawBackground()

    // update/draw gnats
    for (var i=0; i<bgBugs.length; i++){
        bgBugs[i].update();
        bgBugs[i].display();
    }

    // draw lizard eye
    lizardEye.update();
    lizardEye.display();

    // draw lizard body
    lizardBody.update();
    lizardBody.display();

    // draw trial
    drawCurrentState();

    // show score
    drawScore();
}

/**
 * Functions to control various aspects of the task
 */
function startTask(){
    taskSt = millis();
    taskStarted = true;
    taskState = 'rest';
    restSt = millis();
}


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


function drawCurrentState(){
    // internal logic for what to display on screen based on current task state

    // GO/NO-GO TRIALS -----------------------------
    if (taskState == 'goTrial' || taskState == 'noGoTrial'){
        // update the trial bug
        trialBug.update()

        // if the trial is still alive, update everything else and display
        if (trialBug.trialStatus == 'alive'){

            // display bug
            trialBug.display(taskState)

        // otherwise, switch to next state
        } else {
            nextTaskState(taskState);
        }

    // REST STATES -----------------------------
    } else if (taskState == 'rest'){

        // make sure full task duration has elapsed
        var restElapsed = millis()-restSt;
        if (restElapsed >= 2000){
            nextTaskState();
        }

    // END STATE -------------------------------
    } else if (taskState == 'end'){
        lizardEye.update(eyeCenter.x, eyeCenter.y);
        lizardEye.display();

        fill(255,100);
        noStroke();
        rect(0,0,width,height);

        fill(232,12,122);
        textFont('Courier')
        textSize(60);
        textAlign(CENTER, CENTER);
        text('All Done!', width*.5, height*.25);
        textSize(42);
        text('(refresh to restart)', width/2, height*.65);
    }
}


function drawScore(){
    textFont('Helvetica')
    textSize(65);
    stroke(255);
    strokeWeight(3);

    // go Score
    fill(goColor);
    text(goScore, .25*width, .95*height);

    // noGo Score
    fill(noGoColor);
    text(noGoScore, .75*width, .95*height);
}

function nextTaskState(){
    // reset the lizard body
    lizardBody.reset();

    // switch to the next task state
    switch(taskState){
        // if the current state is a go or noGo trial, switch to rest
        case 'goTrial':
        case 'noGoTrial':
            taskState = 'rest';
            restSt = millis();
            break
        case 'rest':
            trialNum += 1;
            console.log('trial num: ' + trialNum);

            if (trialNum > trialOrder.length){
                taskState = 'end';
            } else {
                taskState = trialOrder[trialNum-1];
            }
            break
    };
    console.log(taskState);
}

function keyTyped(){
    if (key === 'o'){
        lizardBody.mouthIsOpen = true;
    } else if (key === 'c'){
        lizardBody.mouthIsOpen = false;
    } else if (key == 't'){
        catchBug();
    };
}

function catchBug(){
    // make sure it's not a rest trial
    if (taskState == 'goTrial' || taskState == 'noGoTrial'){
        if (lizardBody.mouthIsOpen){
            lizardBody.catchBug();  // have lizard shoot tongue out
            trialBug.catchBug();    // update the bug to "caught" status

            // update the scores
            if (taskState == 'goTrial'){
                goScore += 1;
            } else if (taskState == 'noGoTrial'){
                noGoScore -= 1;
            };
        } else {
            console.log('cannot catch bug, mouth is closed...')
        }

    } else {
        console.log('cannot catch bug, currently a REST trial');
    }
}

/**
 * Classes to represent various components of the task
 */
function LizardBody(lizardImg, mouthOpenImg, mouthClosedImg){

    this.lizardImg = lizardImg;
    this.mouthOpenImg = mouthOpenImg;
    this.mouthClosedImg = mouthClosedImg;
    this.mouthIsOpen = false;
    this.showTongue = false;
    this.tongueStart = {x: 265, y: 325}
    this.tongueColor = color(225, 170, 120);
    this.tongueEnd = {x: 0, y: 0};
    this.tongueSt = 0;
    this.tongueDur = 250;

    this.update = function(){
        // update the pos of tongueEnd based on pos
        var bugPos = trialBug.getPos();
        this.tongueEnd = {x: bugPos.x, y: bugPos.y}
    }

    this.display = function(){
        // place lizard body
        image(this.lizardImg, 0, 0);

        // draw mouth
        if (this.mouthIsOpen){
            image(this.mouthOpenImg, 247, 327);
        } else {
            image(mouthClosedImg, 247, 320);
        };

        // draw tongue
        if (this.showTongue){
            var elapsedTongue = millis() - this.tongueSt;
            if (elapsedTongue <= this.tongueDur){
                stroke(this.tongueColor);
                strokeWeight(5);
                line(this.tongueStart.x, this.tongueStart.y,
                     this.tongueEnd.x, this.tongueEnd.y);
            }
        };
    };

    this.catchBug = function(){
        this.showTongue = true;
        this.tongueSt = millis();
    }

    this.reset = function(){
        // reset the lizard
        this.mouthIsOpen = false;
        this.showTongue = false;
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

    this.update = function(){
        // look at bug if one is present
        if (trialBug.trialStatus == 'alive'){
            this.lookAt(trialBug.getPos());

        // otherwise set eye to straight ahead
        } else {
            this.lookAt(this.eyeCenter);
        };
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
        strokeWeight(1);
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

    this.lookAt = function(pos){
        // set the eye to look at the given pos
        var x = pos.x;
        var y = pos.y;
        // rotation angle between target and eye
        this.angle = atan2(y - this.eyeCenter.y,
                           x - this.eyeCenter.x);

        // update the distances of each eye component
        this.ring1_dist = constrain(dist(x, y, this.eyeCenter.x,
                                               this.eyeCenter.y),
                                               -this.ring1_maxDist,
                                               this.ring1_maxDist);
        this.ring2_dist = constrain(dist(x, y, this.eyeCenter.x,
                                               this.eyeCenter.y),
                                               -this.ring2_maxDist,
                                               this.ring2_maxDist);
        this.pupil_dist = constrain(dist(x, y, this.eyeCenter.x,
                                               this.eyeCenter.y),
                                               -this.pupil_maxDist,
                                               this.pupil_maxDist);
    };
}

function TrialBug(){
    this.bugColor = {'goTrial': goColor,
                     'noGoTrial': noGoColor};

    // initial config vars
    this.trialStatus = 'dead';
    this.trialSt = 0;
    this.elapsedTime = 0;
    this.x = 0;
    this.y = 0;
    this.yOff = 0;
    this.bugCaught = false;
    this.bugVisible = false;

    this.update = function(){
        // start trial if necessary
        if (this.trialStatus == 'dead'){
            this.startTrial()
        }

        // calculate elapsed time
        this.elapsedTime = millis() - this.trialSt;

        // if trial still alive...
        if (this.elapsedTime <= trialDur && this.bugCaught == false){
            // update position. X is function of elapsed time; Y is noise flutter
            this.x = width - ((millis()-this.trialSt)/trialDur * width);
            this.yOff += .06;
            this.y += (noise(this.yOff)-.5)*10;  // flutters in the y-dim
            this.y = constrain(this.y, .1*height, .9*height);
        } else {
            this.resetBug();
        }
    }

    this.display = function(trialType){
        if (this.bugVisible){
            fill(this.bugColor[trialType]);
            stroke(100);
            strokeWeight(1);
            ellipse(this.x, this.y, 10);
        }
    }

    this.startTrial = function(){
        // set starting position of the bug
        this.x = width;
        this.y = random(.1*height, .8*height);
        this.yOff = random(0,10);
        this.bugVisible = true;

        // record start time
        this.trialSt = millis();
        this.trialStatus = 'alive';
    }

    this.getPos = function(){
        // return current x,y pos of bug
        return {x: this.x, y: this.y};
    }

    this.catchBug = function(){
        // set "caught" flag to TRUE
        this.bugCaught = true;
        this.bugVisible = false;
    }

    this.resetBug = function(){
        // reset all of the bug variables
        this.trialStatus = 'dead';
        this.trialSt = 0;
        this.elapsedTime = 0;
        this.x = 0;
        this.y = 0;
        this.yOff = 0;
        this.bugCaught = false;
        this.bugVisible = false;
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
