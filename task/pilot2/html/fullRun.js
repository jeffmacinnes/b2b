/**
2-class Classifier Training run

2 trial types -- REST and TASK -- that alternate.
Each trial is 16 sec long (8 samples at 2s TR)

Run begins and ends with a 6sec fixation screen
**/

var runType = 'Full Run'
var speedFactor = 1;

var w, h;
var taskStage;
var taskStarted = false;
var dummyScansStartTime;
var preTaskStartTime, postTaskStartTime;
var trialStarted = false;
var trialOrder = ['rest', 'active',
                    'rest', 'active',
                    'rest', 'active',
                    'rest', 'active',
                    'rest', 'active',
                    'rest', 'active',
                    'rest', 'active',
                    'rest', 'active'];


var dummyScansDur = 4000;   // duration of dummy scans (ms)
var preTaskDur = 4000;      // duration of preTask (ms)
var postTaskDur = 4000;
var restDur = 16000;
var activeDur = 16000;

var trialNum = 0;
var stimSize = 300;
var currentTrial


function setup(){
    w = windowWidth;
    h = windowHeight;
    createCanvas(w, h)

    rectMode(CENTER);
    ellipseMode(CENTER);

    textSize(32);
    textAlign(CENTER, CENTER);

    currentTrial = trialOrder[trialNum]
}


function draw(){
    background(150);

    if (taskStarted != true){
        drawStartButton();
    } else {
        if (taskStage == 'dummyScans'){
            drawDummyScans();
        } else if (taskStage == 'preTask'){
            drawPreTask();
        } else if (taskStage == 'task'){
            drawTrial();
        } else if (taskStage == 'postTask'){
            drawPostTask();
        } else if (taskStage == 'end'){
            drawEnd();
        }
    }
}


function drawStartButton(){
    fill(0)
    text(runType, w/2, h/2-350)
    text('click circle to start', w/2, h/2-200);
    textSize(18);
    text('speedFactor: ' + speedFactor, w/2, h/2-150)
    textSize(32);

    // mouse distance
    var d = dist(mouseX, mouseY, w/2, h/2);
    if (d<100){
        fill(254, 205, 83);
    } else {
        fill(253, 152, 39);
    }
    ellipse(w/2, h/2, 200);
}


function mousePressed(){
    // start the task if not started yet and user has clicked in circle
    if (taskStarted != true) {
        var d = dist(mouseX, mouseY, w/2, h/2);
        if (d<100){
            taskStarted = true;
            taskStage = 'dummyScans';
        }
    }
}


function drawDummyScans(){
    // set start time
    if (dummyScansStartTime == null){
        dummyScansStartTime = millis();
    }

    fill(0);
    textSize(64);
    text('waiting for dummy scans', w/2, h/2);
    textSize(32);

    var elapsedTime = millis() - dummyScansStartTime;
    if (elapsedTime > (dummyScansDur/speedFactor)){
        nextStage();
    }
}

function drawPreTask(){
    // set start time
    if (preTaskStartTime == null){
        preTaskStartTime = millis();
    }

    fill(0);
    textSize(64);
    text('+', w/2, h/2);
    textSize(32);

    var elapsedTime = millis() - preTaskStartTime;
    if (elapsedTime > (preTaskDur/speedFactor)){
        nextStage();
    }
}

function drawTrial(){
    if (currentTrial == 'rest'){
        drawRestTrial();
    } else if (currentTrial == 'active') {
        drawActiveTrial();
    }
}


function drawRestTrial(){
    if (trialStarted == false){
        trialSt = millis();
        trialStarted = true;
    }

    // show rest stimuli
    noStroke();
    fill(255);
    rect(w/2, h/2, stimSize, stimSize);

    fill(0);
    text('REST', w/2, h/2-stimSize/2-50)

    // wait for duration of trial to pass
    if ((millis()-trialSt) >= (restDur/speedFactor)){
        nextTrial();
    }
}


function drawActiveTrial(){
    if (trialStarted == false){
        trialSt = millis();
        trialStarted = true;
    }

    noStroke();
    fill(47, 213, 102);
    ellipse(w/2, h/2, stimSize);

    // wait for duration of trial to pass
    if ((millis()-trialSt) >= (activeDur/speedFactor)){
        nextTrial();
    }
}

function drawPostTask(){
    // set start time
    if (postTaskStartTime == null){
        postTaskStartTime = millis();
    }

    fill(0);
    textSize(64);
    text('+', w/2, h/2);
    textSize(32);

    var elapsedTime = millis() - postTaskStartTime;
    if (elapsedTime > (postTaskDur/speedFactor)){
        nextStage();
    }
}


function drawEnd(){
    fill(0);
    noStroke();
    text('ALL DONE! (refresh to restart)', w/2, h/2);
}


function nextStage(){
    var currentStage = taskStage;
    console.log('current stage: ' + currentStage);
    switch(currentStage){
        case 'dummyScans':
            taskStage = 'preTask';
            break;
        case 'preTask':
            taskStage = 'task';
            break;
        case 'task':
            taskStage = 'postTask';
            break;
        case 'postTask':
            taskStage = 'end';
            break;
    }
    console.log('switched to: ' + taskStage);
}


function nextTrial(){
    trialStarted = false;
    trialNum += 1;
    if (trialNum >= trialOrder.length){
        nextStage();
    } else {
        currentTrial = trialOrder[trialNum];
        console.log('trial count: ' + trialNum);
    }

}
