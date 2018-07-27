/* SOCKET VARS */
var senderIsConnected = false;
var receiverIsConnected = false;
var senderButton;
var receiverButton;
var socket;

/* LIZARD VARS */
var lizardImg;
var mouthOpenImg;
var mouthClosedImg;
var lizardBody;
var lizardEye;
var mouthIsOpen = false;
var showTongue = false;
var lizardSkinLight = '#f0edcf';
var lizardSkinDark = '#d6d3ab';
var eyeCenter = {x: 257, y: 300};
var eyeRadius = 9;

/* bugs and TARGET VARS */
var bgBugs = [];
var nBgBugs = 50;
var trialBug;
var goColor = '#AD81FE';
var noGoColor = '#DD5044';

/* TASK CONTROL VARS */
var cnv;
var fr = 25;
var taskStarted = false;
var BG_yOff;
var taskState;// = 'startScreen';
var score = {goTrial: 0, noGoTrial: 0};
var startButtonPos = {x: 400, y: 300};
var startButtonRad = 80;
var trialDur = 8000;

/**
 * MAIN P5 SETUP/DRAW FUNCTIONS ----------------------------------------------
 */
function preload(){
    // load all images
    lizardImg = loadImage('stimuli/drawing_small.png');
    mouthOpenImg = loadImage('stimuli/mouthOpen_small.png');
    mouthClosedImg = loadImage('stimuli/mouthClosed_small.png');
}

function setup(){
    var cnv = createCanvas(800, 600);
    cnv.parent('taskSketchDiv');
    rectMode(CORNER);
    ellipseMode(RADIUS);
    textAlign(CENTER, CENTER);
    frameRate(fr);

    // set offset value for procedural BG hills
    BG_yOff = random(0,100);

    /* SETUP SOCKET AND EVENT HANDLERS */
    socket = io.connect(window.location.origin)
    socket.on('connectedClients', updateConnectedClients);
    socket.on('setTaskState', setTaskState);
    socket.on('openMouth', openMouth);
    socket.on('closeMouth', closeMouth);
    socket.on('updateScore', updateScore);
    socket.on('catchBug', catchBug);

    // buttons to identify as sender/receiver
    createCheckInButtons();

    // create instances of sketch objects
    lizardBody = new LizardBody(lizardImg, mouthOpenImg, mouthClosedImg);
    lizardEye = new LizardEye(eyeCenter.x, eyeCenter.y, eyeRadius);
    trialBug = new TrialBug();
    for (var i=0; i<=nBgBugs; i++){
        bgBugs.push(new BgBug());
    }
}

function draw(){
    // draw background
    drawBackground();

    // update/draw bg bugs
    drawBgBugs();

    // draw lizard eye
    drawLizard();

    // show score
    drawScore();

    // draw current state
    drawCurrentState();
};

function createCheckInButtons(){
    // create the buttons that will allow each client to check in w/ roles to node server
    senderButton = createButton('choose');
    senderButton.position(.35*width - 32, .3*height);
    senderButton.parent('taskSketchDiv')
    senderButton.mousePressed(senderCheckedIn);
    receiverButton = createButton('choose');
    receiverButton.position(.65*width - 30, .3*height);
    receiverButton.parent('taskSketchDiv');
    receiverButton.mousePressed(receiverCheckedIn);
}


/**
 * DRAW FUNCTIONS FOR TASK STAGES -------------------------------------------
 */
function drawBackground(){
    // draw the background hills and sky
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
    };
}

function drawBgBugs(){
    // update and display the background bugs
    for (var i=0; i<bgBugs.length; i++){
        bgBugs[i].update();
        bgBugs[i].display();
    };
}

function drawLizard(){
    // update and display the lizard eye and body
    lizardEye.update();
    lizardEye.display();

    lizardBody.update();
    lizardBody.display();
}

function drawScore(){
    // draw the current score on the screen
    textFont('Helvetica')
    textSize(65);
    stroke(255);
    strokeWeight(3);

    // go Score
    fill(goColor);
    text(score.goTrial, .25*width, .95*height);

    // noGo Score
    fill(noGoColor);
    text(score.noGoTrial, .75*width, .95*height);
}

function drawCurrentState(){
    switch(taskState){
        case 'startScreen':
            drawStartScreen();
            break;
        case 'dummyScans':
        case 'rest':
            drawRestScreen();
            break;
        case 'goTrial':
        case 'noGoTrial':
            drawTrialScreen();
            break;
        case 'end':
            drawEndScreen();
    }
}

function drawStartScreen(){
    // white transparent overlay
    noStroke();
    fill(255, 200);
    rect(0, 0, width, height);

    // draw connection indicators for sender and receiver
    var connectedColor = color(84, 174, 80, 255);
    var disconnectedColor = color(84, 174, 80, 40);
    fill(connectedColor);
    textSize(24);
    text('start button will appear once SENDER and RECEIVER both sign in', width/2, .1*height);
    textSize(18);
    text('sender', .35*width, .27*height);
    text('receiver', .65*width, .27*height);
    stroke(120);
    senderIsConnected ? fill(connectedColor) : fill(disconnectedColor); // sender
    ellipse(.35*width, .2*height, 20);
    receiverIsConnected ? fill(connectedColor) : fill(disconnectedColor); // receiver
    ellipse(.65*width, .2*height, 20);

    // show start button if both sender & receiver are checked in
    if (senderIsConnected && receiverIsConnected){
        var d = dist(mouseX, mouseY, startButtonPos.x, startButtonPos.y);
        (d <= startButtonRad) ? fill(255, 141, 0) : fill(244, 191, 117);
        ellipse(startButtonPos.x, startButtonPos.y, startButtonRad);
        fill(255);
        noStroke();
        textSize(32);
        text('start!', startButtonPos.x, startButtonPos.y);
    }
}

function drawRestScreen(){
    var a = 3;
}

function drawTrialScreen(){
    // update and display the position of the target bug on the screen
    trialBug.update();
    trialBug.display();
}

function drawEndScreen(){
    fill(255,150);
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

/**
 * INTERACTIVITY (MOUSE/KEY PRESSES) ------------------------------------------
 */
// functions for simulating responses
function keyTyped(){
    if (key == 's'){
        senderCheckedIn()
    } else if (key == 'o'){
        sendMsgToServer('openMouth');
    } else if (key == 'c'){
        sendMsgToServer('closeMouth');
    } else if (key == ' '){
        sendMsgToServer('catchBug');
    }
};

function mousePressed(){
    if (taskState == 'startScreen'){
        if (senderIsConnected && receiverIsConnected){
            var d = dist(mouseX, mouseY, startButtonPos.x, startButtonPos.y);
            if (d <= startButtonRad){
                sendMsgToServer('startTask');
            };
        };
    };
}


/**
 * INCOMING SOCKET MESSAGE HANDLERS -------------------------------------------
 */
function updateConnectedClients(msg){
    // update which clients are connected to the node server
    senderIsConnected = msg.sender;
    receiverIsConnected = msg.receiver;

    if (senderIsConnected) {
        senderButton.hide();
    } else {
        senderButton.show();
    };

    if (receiverIsConnected){
        receiverButton.hide();
    } else {
        receiverButton.show();
    };
};

function setTaskState(msg){
    // set the current task state to the state represented in msg
    taskState = msg;
    if (taskState == 'goTrial' || taskState == 'noGoTrial'){
        // reset the trialBug and set according to taskState
        trialBug.startNewTrial(taskState)

    } else if (taskState == 'rest'){
        // reset the trialBug
        trialBug.resetBug()

        // reset the trialBug and set as a new noGoTrial Bug
        lizardEye.resetEye();
    };

    console.log('task state set as: ' + taskState);
}

function openMouth(){
    // open the lizard's mouth
    lizardBody.mouthIsOpen = true;
}

function closeMouth(){
    // close the lizard's mouth
    lizardBody.mouthIsOpen = false;
}

function updateScore(newScore){
    // update score with newScore obj from nodeserver
    score = newScore;
}

function catchBug(){
    lizardBody.catchBug();
    trialBug.catchBug();
    lizardEye.resetEye();
}

/**
 * OUTGOING SOCKET MESSAGE HANDLERS -------------------------------------------
 */
function sendMsgToServer(msg){
    // send the specified msg to the server
    socket.emit(msg);
}

function senderCheckedIn(){
    // tell node server that sender has checked in
    sendMsgToServer('senderCheckIn');
};

function receiverCheckedIn(){
    // tell node server that receiver has checked in
    sendMsgToServer('receiverCheckIn');
};


/**
 * CLASSES -------------------------------------------------------------------
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
    this.tongueDur = 150;

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
            } else {
                // reset the body after the tongue window has elapsed
                this.resetTongue();
                this.mouthIsOpen = false;
            }
        };
    };

    this.catchBug = function(){
        this.showTongue = true;
        this.tongueSt = millis();
    }

    this.resetTongue = function(){
        // reset the lizard
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
        if (taskState == 'goTrial' || taskState == 'noGoTrial'){
            if (trialBug.bugCaught == false){
                this.lookAt(trialBug.getPos());
            } else {
                this.lookAt(this.eyeCenter);
            }
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

    this.resetEye = function(){
        // reset the eye to look at center again
        this.lookAt(this.eyeCenter);
    }
}

function TrialBug(){
    this.bugColor = {'goTrial': goColor,
                     'noGoTrial': noGoColor};

    // initial config vars
    this.trialSt = 0;
    this.elapsedTime = 0;
    this.x = 0;
    this.y = 0;
    this.yOff = 0;
    this.bugCaught = false;

    this.update = function(){
        // calculate elapsed time
        //this.elapsedTime = millis() - this.trialSt;

        // if trial still alive...
        if (this.bugCaught === false){
            // update position. X is function of elapsed time; Y is noise flutter
            this.x = width - ((millis()-this.trialSt)/trialDur * width);
            this.yOff += .06;
            this.y += (noise(this.yOff)-.5)*10;  // flutters in the y-dim
            this.y = constrain(this.y, .1*height, .9*height);
        };
    }

    this.display = function(){
        if (this.bugCaught == false){
            fill(this.bugColor[this.bugType]);
            stroke(100);
            strokeWeight(1);
            ellipse(this.x, this.y, 10);
        }
    }

    this.startNewTrial = function(bugType){
        // set the new bug type for this trial
        this.bugType = bugType;

        // set starting position of the bug
        this.x = width;
        this.y = random(.1*height, .8*height);
        this.yOff = random(0,10);

        // trial control vars
        this.trialSt = millis();
        this.bugCaught = false;
    }

    this.getPos = function(){
        // return current x,y pos of bug
        return {x: this.x, y: this.y};
    }

    this.catchBug = function(){
        // set "caught" flag to TRUE
        this.bugCaught = true;
    }

    this.setBugType = function(bugType){
        // set the bug type
        this.bugType = bugType;
    }

    this.resetBug = function(){
        // reset all of the bug variables
        this.x = 0;
        this.y = 0;
        this.yOff = 0;
        this.bugCaught = false;
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
        this.xOff += 0.001;
        var mx = noise(this.xOff)*3
        this.x += random(-mx, mx);
        this.yOff += 0.001;
        var my = noise(this.yOff)*3
        this.y += random(-my, my);
    }

    this.display = function(){
        noStroke();
        fill(120, 50);
        ellipse(this.x, this.y, this.r);
    }
}
