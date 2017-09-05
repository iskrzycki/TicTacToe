var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = 3000;

var players = [];
var allClients = [];

app.use('/scripts', express.static(__dirname + '/scripts'));  
app.use('/styles', express.static(__dirname + '/styles'));  

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    allClients.push(socket);
    io.emit('userCounter', allClients.length);
    io.emit('playerList', players);
    console.log('user connected', socket.id);
    console.log('user count:', allClients.length);

    // socket.on('draw', function(data, elem) {
    //     console.log('DRAW:', data, 'by:', socket.id);
    //     if (data === 'o') {
    //         io.emit('draw', 'o', elem);
    //     } else if (data === 'x') {
    //         io.emit('draw', 'x', elem);
    //     }
    // });

    socket.on('newPlayer', function(name) {
        socket.playerName = name;
        console.log('New player: ', name);
        players.push(name);
        io.emit('playerList', players);
    });

    socket.on('createRoom', function(secondPlayerName) {
        var roomName = socket.playerName + " vs " + secondPlayerName;
        console.log('creating room', roomName);
        
        socket.join(roomName);
        var secondPlayerSocket = allClients.filter(function(obj) {
            return obj.playerName === secondPlayerName;
        });
        secondPlayerSocket[0].join(roomName);

        var gameData = {
            roomName: roomName
        };

        socket.symbol = 'x';
        secondPlayerSocket[0].symbol = 'o';

        io.to(roomName).emit('startGame', gameData);
        io.to(socket.id).emit('symbol', {playerType:'x'});
        io.to(secondPlayerSocket[0].id).emit('symbol', {playerType:'o'});
    });

    socket.on('move', function(elem) {
        io.emit('draw', socket.symbol, elem);
    });

    socket.on('disconnect', function() {
        var i = allClients.indexOf(socket);
        var j = players.indexOf(allClients[i].playerName);
        allClients.splice(i, 1);
        if (j > -1) {
            players.splice(j, 1);    
        }
        
        io.emit('playerList', players);
        io.emit('userCounter', allClients.length);
        console.log('user count:', allClients.length);
        console.log('player count:', players.length);
    });
});

server.listen(port, function() {
    console.log('Listening on port', port);
});