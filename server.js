var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = 3000;

var players = [];
var allClients = [];
var board;

app.use('/scripts', express.static(__dirname + '/scripts'));  
app.use('/styles', express.static(__dirname + '/styles'));  

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    allClients.push(socket);
    io.emit('userCounter', allClients.length);
    io.emit('playerList', players);
    console.log('user connected', socket.id);
    console.log('user count:', allClients.length);

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
        // todo: replace it to array of boards
        board = ['0','1','2','3','4','5','6','7','8'];
    });

    socket.on('move', function(elem) {
        // todo: check if it's player turn
        io.emit('draw', socket.symbol, elem);
        board[elem.id] = socket.symbol;
        console.log('board', board);
        // todo switch player turn
        checkWinner();
    });

    function checkWinner () {
        var horizontal = checkIfEqual(board[0], board[1], board[2]) || checkIfEqual(board[3], board[4], board[5]) || checkIfEqual(board[6], board[7], board[8]);
        var vertical = checkIfEqual(board[0], board[3], board[6]) || checkIfEqual(board[1], board[4], board[7]) || checkIfEqual(board[2], board[5], board[8]);
        var cross = checkIfEqual(board[0], board[4], board[8]) || checkIfEqual(board[2], board[4], board[6]);

        if (horizontal || vertical || cross) {
            // todo: emit only to current players
            io.emit('winner');
        }
    }

    function checkIfEqual(a, b, c) {
        return a === b && a === c;
    }

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

// TODO LIST - features
// [] switching turn
// [] hide players list when play
// [] show only available players on the list
// [] win algorythm fix
// [] support multiple boards
// [] leave room and end game when player disconnected

// TODO LIST - refactor
// [] divide server and cliento into separate files
// [] do not pass whole html element through websocket
// [] use react