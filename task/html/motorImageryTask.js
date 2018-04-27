var speedFactor = 1;

var w, h;
var disdaqsElapsed = false;
var taskStarted = false;

var trialNum = 0;
var trialOrder = [
    'rest', 'motor',        // each 2 trial block is 30sec (20 rest, 10 active)
    'rest', 'imagery',
    'rest', 'imagery',
    'rest', 'motor',
    'rest', 'imagery',
    'rest', 'motor'
];

// total task time: 6s dd + 3 min (180 s)
// @ 1s TR: 186 timepts
// @ 1.5s TR: 124 timepts
// @ 2s TR: 93 timepts

var disdaqsDur = 6000
var restDur = 20000;
var motorDur = 10000;
var imageryDur = 10000;
var stimSize = 300;

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
    currentTrial = trialOrder[trialNum];
}


function draw(){
    background(150);

    if (taskStarted != true){
        // present start button
        drawStartButton();
    } else {
        // check if disdaqs elapsed
        if (disdaqsElapsed != true){
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
    } else if (currentTrial == 'motor') {
        drawMotorTrial();
    } else if (currentTrial == 'imagery') {
        drawImageryTrial();
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


function drawMotorTrial(){
    if (trialStarted == false){
        trialSt = millis();
        trialStarted = true;
    }

    noStroke();
    fill(255);
    ellipse(w/2, h/2, stimSize);

    fill(0);
    text('SQUEEZE', w/2, h/2-stimSize/2-50);

    // wait for duration of trial to pass
    if ((millis()-trialSt) >= (motorDur/speedFactor)){
        nextTrial();
    }
}


function drawImageryTrial(){
    if (trialStarted == false){
        trialSt = millis();
        trialStarted = true;
    }

    stroke(255);
    strokeWeight(5);
    noFill();
    ellipse(w/2, h/2, stimSize);

    fill(0);
    noStroke();
    text('IMAGINE', w/2, h/2-stimSize/2-50);

    // wait for duration of trial to pass
    if ((millis()-trialSt) >= (imageryDur/speedFactor)){
        nextTrial();
    }
}


function drawEnd(){
    fill(0);
    noStroke();
    text('ALL DONE! (refresh to restart)', w/2, h/2);
}
