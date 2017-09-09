var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = 3000;

var players = {};
var allClients = {};

app.use('/scripts', express.static(__dirname + '/scripts'));
app.use('/styles', express.static(__dirname + '/styles'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    allClients[socket.id] = socket;

    io.emit('userCounter', Object.keys(allClients).length);
    io.emit('playerList', players);
    console.log('user connected', socket.id);
    console.log('user count:', Object.keys(allClients).length);

    socket.on('newPlayer', function(name) {
        var player = {
            name: name,
            id: socket.id,
            inGame: false
        }
        socket.player = player;
        console.log('New player: ', player.name);
        players[socket.id] = player;

        // TODO: validate player name
        io.emit('playerList', players);
    });

    socket.on('createRoom', function(secondPlayerId) {
        var secondPlayerSocket = io.sockets.sockets[secondPlayerId];
        var roomName = socket.player.name + " vs " + secondPlayerSocket.player.name;
        console.log('creating room', roomName);

        socket.join(roomName);
        secondPlayerSocket.join(roomName);

        var room = {
            name: roomName,
            host: {
                id: socket.id,
                name: socket.player.name,
                symbol: 'x',
                canMove: true
            },
            guest: {
                id: secondPlayerSocket.id,
                name: secondPlayerSocket.player.name,
                symbol: 'o',
                canMove: false
            },
            board: ['0','1','2','3','4','5','6','7','8']
        };

        socket.player.inGame = true;
        secondPlayerSocket.player.inGame = true;

        socket.room = room;
        secondPlayerSocket.room = room;

        io.to(roomName).emit('startGame', room);

        io.to(socket.id).emit('switch turn', true);
        io.to(secondPlayerSocket.id).emit('switch turn', false);
        io.emit('playerList', players);
    });

    socket.on('move', function(elem) {
        var currentPlayer;
        var opponent;

        if (socket.room.host.id === socket.id) {
            currentPlayer = socket.room.host;
            opponent = socket.room.guest;
        } else if (socket.room.guest.id === socket.id) {
            currentPlayer = socket.room.guest;
            opponent = socket.room.host;
        }

        if (currentPlayer.canMove) {
            currentPlayer.canMove = false;
            opponent.canMove = true;

            socket.room.board[elem.id] = currentPlayer.symbol;

            io.to(socket.room.name).emit('draw', currentPlayer.symbol, elem);
            io.to(currentPlayer.id).emit('switch turn', currentPlayer.canMove);
            io.to(opponent.id).emit('switch turn', opponent.canMove);
        }

        console.log('board', socket.room.board);
        checkWinner(socket.room);
    });

    function checkWinner (room) {
        var board = room.board;

        var horizontal = checkIfEqual(board[0], board[1], board[2]) || checkIfEqual(board[3], board[4], board[5]) || checkIfEqual(board[6], board[7], board[8]);
        var vertical = checkIfEqual(board[0], board[3], board[6]) || checkIfEqual(board[1], board[4], board[7]) || checkIfEqual(board[2], board[5], board[8]);
        var cross = checkIfEqual(board[0], board[4], board[8]) || checkIfEqual(board[2], board[4], board[6]);

        if (horizontal || vertical || cross) {
            io.to(room.name).emit('winner');

            // TODO: remove room from array
            players[room.host.id].inGame = false;
            players[room.guest.id].inGame = false;
            io.emit('playerList', players);
        }
    }

    function checkIfEqual(a, b, c) {
        return a === b && a === c;
    }

    socket.on('disconnect', function() {
        delete players[socket.id];
        delete allClients[socket.id];

        // todo: check if player was playing with someone
        io.emit('playerList', players);
        io.emit('userCounter', Object.keys(allClients).length);
        console.log('user count:', Object.keys(allClients).length);
        console.log('player count:', Object.keys(players).length);
    });
});

server.listen(port, function() {
    console.log('Listening on port', port);
});

// TODO LIST - features
// [X] switching turn
// [X] hide players list when play
// [X] show only available players on the list
// [] win algorythm fix
// [?] support multiple boards
// [] leave room and end game when player disconnected
// [] player name validation
// [] store game stats in file or DB

// TODO LIST - refactor
// [] divide server and client into separate files
// [] do not pass whole html element through websocket
// [] use react