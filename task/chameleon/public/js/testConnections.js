var senderIsConnected = false;
var receiverIsConnected = false;
var taskStarted = false;


function setup(){
    createCanvas(800, 800);

    // set up socket streaming
    socket = io.connect(window.location.origin)
    socket.on('startTask', startTask);
    socket.on('senderConnected', senderConnected);
    socket.on('receiverConnected', receiverConnected);
    socket.on('connections', function(reply){
        if (reply.sender == true){
            senderIsConnected = true;
        };

        if (reply.receiver == true){
            receiverIsConnected = true;
        }

    } )

    // request all connections
    socket.emit('getConnections');

    ellipseMode(RADIUS);

}


function draw(){
    background(120)
    taskStarted ? drawTask() : drawStart();
}


function drawStart(){
    // draw sender connection status
    stroke(0);
    senderIsConnected ? fill(255, 0, 0, 255) : fill(255, 0, 0, 20);
    ellipse(.25*width, .2*height, 40);

    // draw receiver connection status
    stroke(0);
    receiverIsConnected ? fill(0, 255, 0, 255) : fill(0, 255, 0, 20);
    ellipse(.75*width, .2*height, 40);

}

// Functions initiated by socket responses
function startTask(){
    console.log('task Started')
}

function senderConnected(){
    console.log('from node: Sender connected')
    senderIsConnected = true;
}

function receiverConnected(){
    receiverIsConnected = true;
}
