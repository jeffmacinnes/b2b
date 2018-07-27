// set up express to host the static site
var port = 8080;
var express = require('express');
var path = require('path');
var app = express();

var server = require('http').Server(app);
server.listen(port)
app.use(express.static('public'))   // host files in the 'public' dir
console.log('node server is listening on port ' + port);

// task logging vars
var fs = require('fs');
var logs = [];
var taskStart;

// set up socket.io
var socket = require('socket.io');
var io = socket(server)  // connect socket function to the express server obj
var connectedClients = {sender: false, receiver:false};
var connectionCounter = 0;
var senderID;
var receiverID;

// Task control vars
var dummyScanDur = 1000;
var trialDur = 8000;  // trial dur in ms
var taskState = 'startScreen';
var trialIncrementor;
var taskSt;
var trialNum = 0;
var trialOrder = ['goTrial', 'noGoTrial',
                    'goTrial', 'noGoTrial'];
var restDur = 2000;
var mouthState = 'closed';
var score = {goTrial: 0, noGoTrial: 0}
var thisTrialCaught = false;


/**
 * DEFINE SOCKETS AND HANDLERS ********************************************
 */
io.sockets.on('connection', function(socket){
    // increment connection counter, send currently connected clients
    connectionCounter++;
    console.log('# connected clients: ' + connectionCounter);
    sendConnectedClients();

    // tell the clients the current task state and score
    sendTaskState();
    sendScore();

    var id = socket.id;     // unique id of the connected client

    /** SOCKET EVENT HANDLERS **********************************************/
    // client identifies as sender
    socket.on('senderCheckIn', function(){
        // set that the sender has connected
        connectedClients.sender = true;
        senderID = id;

        // send the connectedClients obj to all clients
        sendConnectedClients();
    });

    // client identifies as receiver
    socket.on('receiverCheckIn', function(){
        // set that the receiver has connected
        connectedClients.receiver = true;
        receiverID = id;

        // send the connectedClients obj to all clients
        sendConnectedClients();
    })

    // client sends start task command
    socket.on('startTask', function(){
        startTask();
    });

    // client disconnects
    socket.on('disconnect', function(){
        // reduce connectionCounter
        connectionCounter--;
        console.log('# connected clients: ' + connectionCounter);

        // figure out which client this is
        var source = (id == senderID) ? 'SENDER' : 'RECEIVER';

        // set the appropriate flag in connectedClients var
        if (id == senderID){ connectedClients.sender = false; };
        if (id == receiverID){ connectedClients.receiver = false; };

        // send the updated connectedClients obj to all clients
        sendConnectedClients();
    });

    // received openMouth command from client
    socket.on('openMouth', function(){
        updateMouth('openMouth');
    });

    // received closeMouth command from client
    socket.on('closeMouth', function(){
        updateMouth('closeMouth');
    });

    // received catchBug command from client
    socket.on('catchBug', function(){
        catchBug();
    });

    //
    // // received openMouth message from JS client
    // socket.on('openMouth', function(){
    //     var source = (id == senderID) ? 'SENDER' : 'RECEIVER';
    //     addLog('incoming', source, 'openMouth');
    //
    //     // send command to all clients
    //     sendOpenMouth();
    // });
    //
    // // received closeMouth message from one client
    // socket.on('closeMouth', function(){
    //     var source = (id == senderID) ? 'SENDER' : 'RECEIVER';
    //
    //     addLog('incoming', source, 'closeMouth');
    //     sendCloseMouth();
    // });
    //
    // // received catchBug message from one client
    // socket.on('catchBug', function(){
    //     var source = (id == senderID) ? 'SENDER' : 'RECEIVER';
    //
    //     addLog('incoming', source, 'catchBug');
    //     sendCatchBug();
    // });
    //
    // // received endTask message from client
    // socket.on('endTask', function(){
    //     var source = (id == senderID) ? 'SENDER' : 'RECEIVER';
    //
    //     addLog('incoming', source, 'endTask');
    //     endTask();
    // });
    //
    // socket.on('getConnections', sendConnections);
    //
    // // socket disconnects
    // socket.on('disconnect', function(){
    //     connectionCounter--;
    //     console.log('socket id ' + socket.id + ' disconnected; total: ' + connectionCounter);
    // })
});

/**
 * OUTGOING SOCKET MESSAGE HANDLERS *******************************************
 */
function sendConnectedClients(){
    // send the connectedClients obj to all clients
    io.sockets.emit('connectedClients', connectedClients);
}

function sendTaskState(){
    // send the current task state to connected clients
    io.sockets.emit('setTaskState', taskState);

    console.log('emitting task state: ' + taskState);
}

 function sendOpenMouth(){
     // send open mouth command to all connected clients
     io.sockets.emit('openMouth');
     //addLog('outgoing', 'NodeServer', 'openMouth');
 };

 function sendCloseMouth(){
     // send close mouth command to all connected clients
     io.sockets.emit('closeMouth');
     //addLog('outgoing', 'NodeServer', 'closeMouth');
 };

 function sendCatchBug(){
     // send catch bug command to all connected clients
     io.sockets.emit('catchBug');
     //addLog('outgoing', 'NodeServer', 'catchBug');
 };

function sendScore(){
    // send the score object to all connected clients
    io.sockets.emit('updateScore', score)
}

 /**
  * INCOMING WEB ROUTE FUNCTIONS *********************************************
  */
app.get('/openMouth', function(request, response){
    //addLog('incoming', 'webRoute', 'openMouth');
    updateMouth('openMouth');
});

app.get('/closeMouth', function(request, response){
    //addLog('incoming', 'webRoute', 'closeMouth');
    updateMouth('closeMouth');
});

app.get('/catchBug', function(request, response){
    //addLog('incoming', 'webroute', 'catchBug');
    catchBug();
})


 /**
  * TASK CONTROL FUNCTIONS ***************************************************
  */
function startTask(){
    // shuffle the trialOrder array
    //trialOrder = shuffle(trialOrder);
    //console.log(trialOrder);

    // reset score
    score = {goTrial: 0, noGoTrial: 0}
    sendScore();

    // set task state to 'dummyScans' for all clients;
    taskState = 'dummyScans';
    sendTaskState();

    // after dummy scan duration, start the trials
    setTimeout(startTrials, dummyScanDur);
}

function startTrials(){
    // start the first trial
    nextTrial();

}

function nextTrial(){
    if (trialNum >= trialOrder.length){
        // if all trials have elapsed, send end
        taskState = 'end';
        sendTaskState();
    } else {
        // otherwise send the next trial in the trial order
        taskState = trialOrder[trialNum];
        thisTrialCaught = false;
        sendTaskState();
        updateMouth('closeMouth');

        // increment trial counter
        trialNum++;

        // call it again after trial interval
        setTimeout(restTrial, trialDur);
    }
}

function restTrial(){
    // send a rest trial to the task
    taskState = 'rest'
    sendTaskState();

    // make sure the lizards mouth is closed
    updateMouth('closeMouth');

    // after rest interval, call next trial
    setTimeout(nextTrial, restDur);
}

function updateMouth(cmd){
    // update the mouthState, if necessary
    if (cmd == 'openMouth'){
        if (mouthState == 'closed'){
            mouthState = 'open';
            sendOpenMouth();
        } else {
            console.log('mouth already open');
        };
    } else if (cmd == 'closeMouth'){
        if (mouthState == 'open'){
            mouthState = 'closed';
            sendCloseMouth();
        }
    }
};

function catchBug(){
    // confirm that the conditions are met to catch the bug
    if (taskState == 'goTrial' || taskState == 'noGoTrial'){
        if (mouthState === 'open'){
            if (thisTrialCaught == false){
                // increment or decrement the score based on taskState
                switch (taskState){
                    case 'goTrial':
                        score.goTrial++;
                        break;
                    case 'noGoTrial':
                        score.noGoTrial--;
                        break;
                };
                // update status and send command to catch bug and update score
                thisTrialCaught = true;
                sendCatchBug();
                sendScore();

                // and close the mouth
                updateMouth('closeMouth');
            } else {
                console.log('already caught the bug on this trial');
            };
        } else {
            console.log('cannot catch bug, mouth is not open');
        };
    };
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
};


/**
 * LOG FUNCTIONS *************************************************************
 */
function addLog(direction, source, message){
    /** add new log entry.
     * direction: incoming/outgoing
     * source: which component sent the message
     * message: the message type
     */
     logs.push({timestamp: Date.now()-serverStart,
                direction: direction,
                source: source,
                message: message
            });
}
//
// function endTask(){
//     // ask each client for all data
//
//     // save all data to disk
//     var today = new Date();
//     var dateString = today.getFullYear() + '-' +
//                 today.getMonth()+1 + '-' +
//                 today.getDate() + '_' +
//                 today.getHours() + ':' +
//                 today.getMinutes() + ':' +
//                 today.getSeconds();
//
//     var nodeServerJSON = JSON.stringify(logs, null, 3);
//     var nodeServer_fname = 'taskLogs/' + dateString + '_nodeServer.json';
//     fs.writeFile(nodeServer_fname, nodeServerJSON, 'utf-8');
// }
//
// // URL routes that Pyneal can use to update server with data from sender

//
// app.get('/catchBug', function(request, response){
//     addLog('incoming', 'webRoute', 'catchBug');
//     sendCatchBug();
//     response.send('node server got catchBug');
// });
//
//
// app.get('/sender', function(request, response){
//     console.log('sender is connected!')
//     response.sendFile(path.join(__dirname + '/public/task.html'));
//     connectedClients.sender = true;
// })
//
// app.get('/receiver', function(request, response){
//     console.log(request)
//     response.sendFile(path.join(__dirname + '/public/task.html'));
//     connectedClients.receiver = true;
// })
//
// app.get('/senderConnect', senderConnect);
// function senderConnect(request, response){
//     // indicate that sender (aka Pyneal) has initialized a connection
//     addLog('incoming', 'webRoute', 'pynealConnected');
//     console.log('sender connected!');
//
//     // broadcast to clients
//     io.sockets.emit('senderConnected');
//     addLog('outgoing', 'NodeServer', 'senderConnected');
//
//     // send message back to sender, just cuz
//     response.send('sender connected');
// };
//
// app.get('/senderDisconnect', senderDisconnect);
// function senderDisconnect(request, response){
//     // indicate that sender (aka Pyneal) has disconnected
//     addLog('incoming', 'webRoute', 'pynealConnected')
//     console.log('sender disconnected!')
//
//     // broadcast to clients
//     io.sockets.emit('senderDisconnected');
//     addLog('outgoing', 'NodeServer', 'senderDisconnected')
//
//     // send message back to sender, just cuz
//     response.send('sender disconnected');
// };
