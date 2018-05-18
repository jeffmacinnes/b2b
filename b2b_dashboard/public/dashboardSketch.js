var socket;
var host = '127.0.0.1';
var port = '3000';

function setup() {
    createCanvas(400, 400);
    console.log('sketch running');
    socket = io.connect('http://' + host + ':' + port);
    socket.on('mouse', newDrawing);
    background(51);
}

// handle incoming socket data
function newDrawing(data){
    noStroke();
    fill(123,12,144);
    ellipse(data.x, data.y, 30, 30);
}

function mouseDragged(){
    console.log('sending: ' + mouseX + ',' + mouseY);

    // format the data to send to the server over the socket
    var data = {
        x: mouseX,
        y: mouseY
    }
    socket.emit('mouse', data);

    noStroke();
    fill(255);
    ellipse(mouseX, mouseY, 30, 30);

}
