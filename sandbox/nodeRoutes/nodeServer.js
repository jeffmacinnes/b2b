
// Set up server using Express, and start hosting static content from
// 'public' directory
var port = 3000;
var express = require('express')
var app = express();

var server = app.listen(port, listening);
app.use(express.static('public'))

function listening(){
    // callback fn for starting server
    console.log('...listening')
}

// load database
var fs = require('fs') // import filesystem package
var data = fs.readFileSync('words.json')
var words = JSON.parse(data);
console.log(words);

// build routes
// GET request (client gets data from server)
app.get('/search/:flower/:num', sendFlower);
function sendFlower(request, response){
    var data = request.params;
    reply = ""
    for (var i = 0; i < data.num; i++){
        reply += 'I love ' + data.flower + " too"
    }
    response.send(reply);
}

// get full database
app.get('/all', sendAll);
function sendAll(request, response){
    response.send(words);
}

// search for word in database
app.get('/search/:word', findWord);
function findWord(request, response){
    var word = request.params.word;
    var reply;
    if (words[word]){
        reply = {
            status: 'found',
            word: word,
            score: words[word]
        }
    } else {
        reply = {
            status: 'not found',
            word: word
        }
    }
    response.send(reply)
}

// add word and score to database
app.get('/add/:word/:score', addWord);
function addWord(request, response){
    var data = request.params;
    var word = data.word;
    var score = Number(data.score);
    words[word] = score;

    // save to file
    var newData = JSON.stringify(words, null, 2);
    fs.writeFile('words.json', newData, finished);
    function finished(err){
        console.log('all set.')
    }

    var reply = {
        msg: "thank you for your word"
    }
}
