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
var trialDur = 2000;  // trial dur in ms
var taskState = 'startScreen';
var trialIncrementor;
var taskSt;
var trialNum = 0;
var trialOrder = ['goTrial', 'noGoTrial'];


/**
 * DEFINE SOCKETS AND HANDLERS ********************************************
 */
io.sockets.on('connection', function(socket){
    // increment connection counter, send currently connected clients
    connectionCounter++;
    console.log('# connected clients: ' + connectionCounter);
    sendConnectedClients();

    // tell the clients the current task state
    sendTaskState();

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
     addLog('outgoing', 'NodeServer', 'openMouth');
 };

 function sendCloseMouth(){
     // send close mouth command to all connected clients
     io.sockets.emit('closeMouth');
     addLog('outgoing', 'NodeServer', 'closeMouth');
 };

 function sendCatchBug(){
     // send catch bug command to all connected clients
     io.sockets.emit('catchBug');
     addLog('outgoing', 'NodeServer', 'catchBug');
 };

 /**
  * INCOMING WEB ROUTE FUNCTIONS *********************************************
  */



 /**
  * TASK CONTROL FUNCTIONS ***************************************************
  */
function startTask(){
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
        taskState = 'end';
        sendTaskState();
    } else {
        taskState = trialOrder[trialNum];
        sendTaskState();

        // increment trial counter
        trialNum++;

        // call it again after trial interval
        setTimeout(nextTrial, trialDur);
    }
}

//
//
//
//
//
// function addLog(direction, source, message){
//     /** add new log entry.
//      * direction: incoming/outgoing
//      * source: which component sent the message
//      * message: the message type
//      */
//      logs.push({timestamp: Date.now()-serverStart,
//                 direction: direction,
//                 source: source,
//                 message: message
//             });
// }
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
// app.get('/openMouth', function(request, response){
//     addLog('incoming', 'webRoute', 'openMouth');
//     sendOpenMouth();
//     response.send('node server got openMouth');
// });
//
// app.get('/closeMouth', function(request, response){
//     addLog('incoming', 'webRoute', 'closeMouth');
//     sendCloseMouth();
//     response.send('node server got closeMouth');
// });
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
