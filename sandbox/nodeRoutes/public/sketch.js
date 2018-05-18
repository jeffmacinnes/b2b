function setup() {
    createCanvas(400, 400);
    background(51);
    loadJSON('/all', gotData);
    console.log('sketch running');
}



function draw() {
  // put drawing code here
}


function gotData(data){
    console.log(data);
    var keys = Object.keys(data);
    console.log(keys);
    for (var i = 0; i < keys.length; i++){
        var word = keys[i];
        var score = data[word];
        console.log(word);
        var x = random(width);
        var y = random(height);
        fill(255);
        textSize(24);
        text(word, x, y);
    }
}
