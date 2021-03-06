// set up express to host the static site
//var port = 8000;
//var port = process.env.PORT || 8080;   // let port be set by heroku
//console.log('PORT NUMBER: ' + port);
var express = require('express');
var app = express();

//var server = app.listen(port);
//console.log('node server is running...')

var server = require('http').Server(app);
server.listen(process.env.PORT || 8080);
app.use(express.static('public'))   // host files in the 'public' dir
console.log('node server is running...')


// set up socket.io
var socket = require('socket.io');
var io = socket(server)  // connect socket function to the express server obj

// socket events
io.sockets.on('connection', newConnection);
function newConnection(socket){
    var id = socket.id;
    console.log('new socket.io connection received: ' + id);
}

// set up routes for sending data -----------------
// method to retrieve the current port number of the nodeserver
// app.get('/getPortNum', getPortNum);
// function getPortNum(request, response){
//     var msg = {
//         port: port
//     };
//     //msg = JSON.stringify(msg)
//     response.send(msg);
//     console.log('sent ' + msg);
// }

// method for Pyneal to update server with data from sender
app.get('/addProb/:volIdx/:prob', sendProbability);
function sendProbability(request, response){
    // send the volume index and prediction probability to all clients
    var data = request.params;
    var msg = {
        volIdx: Number(data.volIdx),
        prob: Number(data.prob)
    };
    console.log('received from pyneal: ' + JSON.stringify(msg));

    // broadcast to clients
    io.sockets.emit('senderProb', msg);

    // send message back to sender, just cuz
    response.send(msg);
}

app.get('/senderConnect', senderConnect);
function senderConnect(request, response){
    // indicate that sender (aka Pyneal) has initialized a connection
    msg = 'sender connected'
    console.log('sender connected!')

    // broadcast to clients
    io.sockets.emit('senderConnected');

    // send message back to sender, just cuz
    response.send(msg);
}

app.get('/senderDisconnect', senderDisconnect);
function senderDisconnect(request, response){
    // indicate that sender (aka Pyneal) has disconnected
    msg = 'sender disconnected'
    console.log('sender disconnected!')

    // broadcast to clients
    io.sockets.emit('senderDisconnected');

    // send message back to sender, just cuz
    response.send(msg);
}
