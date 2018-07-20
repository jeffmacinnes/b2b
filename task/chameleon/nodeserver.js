// set up express to host the static site
var port = 8080;
var express = require('express');
var app = express();

var server = require('http').Server(app);
server.listen(port)
app.use(express.static('public'))   // host files in the 'public' dir
console.log('node server is listening on port ' + port);

var senderID;
var receiverID;

// task logging vars
var fs = require('fs');
var logs = [];
var taskStart;
//
// for (i=0; i<10; i++){
//     logObj.push({id: i, time: Date.now()});
// }
// var json = JSON.stringify(logObj, null, 3);
// fs.writeFile('testJsonLogs.json', json, 'utf-8');


// set up socket.io
var socket = require('socket.io');
var io = socket(server)  // connect socket function to the express server obj

// socket events between 
io.sockets.on('connection', newConnection);
function newConnection(socket){
    var id = socket.id;
    console.log('new socket.io connection received: ' + id);

    /** receive start message
     * The SENDER is the only client who should send the startMessage, but
     * just to be sure, the task script has separate start buttons for
     * SENDER and RECEIVER, attached to unique functions that send a io.socket
     * message that correctly identifies them. NOTE that only the SENDER will
     * actually start the task
     */
    socket.on('startFromSender', function(){
        senderID = id;
        console.log('got START signal from SENDER. ID: ' + senderID);

        // start the task on all connected clients
        io.sockets.emit('startTask');
    })
    socket.on('startFromReceiver', function(){
        receiverID = id;
        console.log('got START signal from RECEIVER. ID: ' + receiverID);
    })

    // received openMouth message from one client
    socket.on('openMouth', function(){
        if (id == senderID){
            console.log('got openMouth from SENDER')
        } else {
            console.log('got openMouth from RECEIVER')
        };
        sendOpenMouth()
    });

    // received closeMouth message from one client
    socket.on('closeMouth', sendCloseMouth);

    // received catchBug message from one client
    socket.on('catchBug', sendCatchBug);
};



// Functions to send socket messages to ALL clients
function sendOpenMouth(){
    // send open mouth command to all connected clients
    io.sockets.emit('openMouth');
};

function sendCloseMouth(){
    // send close mouth command to all connected clients
    io.sockets.emit('closeMouth');
};

function sendCatchBug(){
    // send catch bug command to all connected clients
    io.sockets.emit('catchBug');
};


// URL routes that Pyneal can use to update server with data from sender
app.get('/openMouth', function(request, response){
    sendOpenMouth();
    response.send('node server got openMouth');
});

app.get('/closeMouth', function(request, response){
    sendCloseMouth();
    response.send('node server got closeMouth');
});

app.get('/catchBug', function(request, response){
    sendCatchBug();
    response.send('node server got catchBug');
});


app.get('/senderConnect', senderConnect);
function senderConnect(request, response){
    // indicate that sender (aka Pyneal) has initialized a connection
    msg = 'sender connected'
    console.log('sender connected!')

    // broadcast to clients
    io.sockets.emit('senderConnected');

    // send message back to sender, just cuz
    response.send(msg);
};

app.get('/senderDisconnect', senderDisconnect);
function senderDisconnect(request, response){
    // indicate that sender (aka Pyneal) has disconnected
    msg = 'sender disconnected'
    console.log('sender disconnected!')

    // broadcast to clients
    io.sockets.emit('senderDisconnected');

    // send message back to sender, just cuz
    response.send(msg);
};
