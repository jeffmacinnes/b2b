
// set up express static web host
var port = 3000;
var express = require('express');
var app = express();
var server = app.listen(port);
app.use(express.static('public'));
console.log('socket server is running...')

// set up socket
var socket = require('socket.io');
var io = socket(server) // connect socket to the server instance

// deal with socket events
io.sockets.on('connection', newConnection);
function newConnection(socket){
    console.log('new connection: ' + socket.id);

    // on events labeled 'mouse'
    socket.on('mouse', mouseMsg);
    function mouseMsg(data){
        socket.broadcast.emit('mouse', data);  // send to all OTHER sockets
        // io.sockets.emit('mouse', data); // send to all sockets, including self
        console.log(data);
    }
}
