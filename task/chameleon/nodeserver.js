// set up express to host the static site
var port = 8080;
//var port = process.env.PORT || 8080;   // let port be set by heroku
//console.log('PORT NUMBER: ' + port);
var express = require('express');
var app = express();

//var server = app.listen(port);
//console.log('node server is running...')

var server = require('http').Server(app);
//server.listen(process.env.PORT || 8080);
server.listen(port)
app.use(express.static('public'))   // host files in the 'public' dir
console.log('node server is listening on port ' + port);


// set up socket.io
var socket = require('socket.io');
var io = socket(server)  // connect socket function to the express server obj

// socket events
io.sockets.on('connection', newConnection);
function newConnection(socket){
    var id = socket.id;
    console.log('new socket.io connection received: ' + id);

    // receive start message from one client
    socket.on('start', function(){
        console.log('got START signal from client');

        // start the task on all connected clients
        io.sockets.emit('startTask');
    })

    // received openMouth message from one client
    socket.on('openMouth', sendOpenMouth);

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
