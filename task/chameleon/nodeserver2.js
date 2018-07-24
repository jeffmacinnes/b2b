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
var trialDur = 8000;  // trial dur in ms
var taskState = 'start';
var taskSt;
var trialNum = 0;
var trialOrder = ['goTrial', 'noGoTrial',
                    'goTrial', 'noGoTrial'];


/** Set up socket function to fire in response to new clients
 * connecting. The socket function will also contain all of the event handlers
 * for possible messages that the socket may receive from each client
 */
io.sockets.on('connection', function(socket){
    // increment connection counter, send currently connected clients
    connectionCounter++;
    console.log('# connected clients: ' + connectionCounter);
    sendConnectedClients();

    var id = socket.id;     // unique id of the connected client

    /** SOCKET EVENT HANDLERS **/
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

    // client disconnects
    socket.on('disconnect', function(){
        // reduce connectionCounter
        connectionCounter--;
        console.log('# connected clients: ' + connectionCounter);

        // figure out which client this is
        var source = (id == senderID) ? 'SENDER' : 'RECEIVER';

        // set the appropriate flag in connectedClients var
        if (id == senderID){
            connectedClients.sender = false;
        } else if (id == receiverID){
            connectedClients.receiver = false;
        }

        // send the updated connectedClients obj to all clients
        sendConnectedClients();
    });

    /** receive start message
     * The SENDER is the only client who should send the startMessage, but
     * just to be sure, the task script has separate start buttons for
     * SENDER and RECEIVER, attached to unique functions that send a io.socket
     * message that correctly identifies them. NOTE that only the SENDER will
     * actually start the task
     */
    // socket.on('startFromSender', function(){
    //     senderID = id;
    //     console.log('got START signal from SENDER. ID: ' + senderID);
    //
    //     // reset the logs array
    //     logs = [];
    //     addLog('incoming', 'SENDER', 'startFromSender');
    //
    //     // start the task on all connected clients
    //     io.sockets.emit('startTask');
    //     addLog('outgoing', 'NodeServer', 'startTask');
    // });
    //
    // socket.on('startFromReceiver', function(){
    //     receiverID = id;
    //     console.log('got START signal from RECEIVER. ID: ' + receiverID);
    // })
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

/** SOCKET EMIT FUNCTIONS
 * These functions will handle sending information to all connected clients.
 * In many cases, theres more than one way to trigger these functions. For
 * instance, the client might elicit it via a incoming socket message, OR a
 * 3rd party can trigger it via a web route (for instance, command from Pyneal)
 */
function sendConnectedClients(){
    // send the connectedClients obj to all clients
    io.sockets.emit('connectedClients', connectedClients);
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
