/**
2-class Classifier Training run

2 trial types -- REST and TASK -- that alternate.
Each trial is 16 sec long (8 samples at 2s TR)

Run begins and ends with a 6sec fixation screen
**/

var speedFactor = 1;

var w, h;
var disdaqsElapsed = false;
var taskStarted = false;

var trialNum = 0;

var tr = 2000  // TR in ms
var nDummyScans = 2  // number of dummy scans in beginning of run
var disdaqsDur = 6000
var trialDur = 16000;
var stimSize = 300;

var dummyScansElapsed = false;
var trialStarted = false;

function setup(){
    w = windowWidth;
    h = windowHeight;
    createCanvas(w, h)

    rectMode(CENTER);
    ellipseMode(CENTER);

    textSize(32);
    textAlign(CENTER, CENTER);

    // initialize the first trial
    currentTrial = getCurrentTrial()
}


function draw(){
    background(150);

    if (taskStarted != true){
        // present start button
        drawStartButton();
    } else {
        // check if disdaqs elapsed
        if (dummyScansElapsed != true){
            drawDummyScans()
        } else if (disdaqsElapse != true){
            drawDisdaqs()
        } else {
            drawTrial()
        }
    }
}


function drawStartButton(){
    fill(0)
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
        }
    }
}


function drawDummyScan(){
    fill(0);
    textSize(64);
    text('waiting for dummy scans', w/2, h/2);
    setTimeout(function(){ disdaqsElapsed=true}, disdaqsDur/speedFactor);
    textSize(32);
}

function drawDisdaqs(){
    // fill(255,0,0);
    // rect(w/2, h/2, 100, 100);

    fill(0);
    textSize(64);
    text('+', w/2, h/2);
    setTimeout(function(){ disdaqsElapsed=true}, disdaqsDur/speedFactor);
    textSize(32);
}


function nextTrial(){
    trialStarted = false;
    trialNum += 1;
    if (trialNum >= trialOrder.length){
        currentTrial = 'end'
    } else {
        currentTrial = trialOrder[trialNum];
    }
}


function drawTrial(){
    if (currentTrial == 'rest'){
        drawRestTrial();
    } else if (currentTrial == 'task') {
        drawTaskTrial();
    } else if (currentTrial == 'end') {
        drawEnd();
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


function drawTaskTrial(){
    if (trialStarted == false){
        trialSt = millis();
        trialStarted = true;
    }

    noStroke();
    fill(255);
    ellipse(w/2, h/2, stimSize);

    // wait for duration of trial to pass
    if ((millis()-trialSt) >= (motorDur/speedFactor)){
        nextTrial();
    }
}




function drawEnd(){
    fill(0);
    noStroke();
    text('ALL DONE! (refresh to restart)', w/2, h/2);
}
