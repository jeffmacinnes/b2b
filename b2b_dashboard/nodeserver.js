// set up express to host the static site
var port = 8000;
var express = require('express');
var app = express();
var server = app.listen(port);
app.use(express.static('public'))   // host files in the 'public' dir
console.log('node server is running...')

// set up socket.io
var socket = require('socket.io');
var io = socket(server)  // connect socket function to the express server obj

// socket events
io.sockets.on('connection', newConnection);
function newConnection(socket){
    var id = socket.id;
    console.log('new connection received: ' + id);
}


// set up routes for sending data -----------------
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

app.get('/pynealConnect', pynealConnect);
function pynealConnect(request, response){
    // indicate that pyneal has started and initialized a connection
    msg = 'pyneal connected'
    console.log('pyneal connected!')

    // broadcast to clients
    io.sockets.emit('pynealConnected');

    // send message back to sender, just cuz
    response.send(msg);
}
