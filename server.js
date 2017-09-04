var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = 3000;

app.use('/scripts', express.static(__dirname + '/scripts'));  
app.use('/styles', express.static(__dirname + '/styles'));  

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('user connected', socket.id);

    socket.on('draw', function(data, elem) {
        console.log('DRAW: ', data);
        if (data === 'o') {
            io.emit('draw', 'o', elem);
        } else if (data === 'x') {
            io.emit('draw', 'x', elem);
        }
        io.emit('erase');
    });
});

server.listen(port, function() {
    console.log('Listening on port', port);
});