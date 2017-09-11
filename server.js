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

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    allClients[socket.id] = socket;

    io.emit('userCounter', Object.keys(allClients).length);
    io.emit('playerList', players);
    console.log('user connected', socket.id);
    console.log('user count:', Object.keys(allClients).length);

    socket.on('newPlayer', function (name) {
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

    socket.on('createRoom', function (secondPlayerId) {
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
            board: ['','','','','','','','','']
        };

        socket.player.inGame = true;
        secondPlayerSocket.player.inGame = true;

        socket.room = room;
        secondPlayerSocket.room = room;

        io.to(roomName).emit('startGame', roomName);

        io.to(socket.id).emit('switch turn', true);
        io.to(secondPlayerSocket.id).emit('switch turn', false);
        io.emit('playerList', players);
    });

    socket.on('move', function (destinationId) {
        var currentPlayer;
        var opponent;

        if (socket.room.host.id === socket.id) {
            currentPlayer = socket.room.host;
            opponent = socket.room.guest;
        } else if (socket.room.guest.id === socket.id) {
            currentPlayer = socket.room.guest;
            opponent = socket.room.host;
        }

        if (currentPlayer.canMove && socket.room.board[destinationId] !== 'x' && socket.room.board[destinationId] !== 'o') {
            console.log('__canMove');
            currentPlayer.canMove = false;
            opponent.canMove = true;

            socket.room.board[destinationId] = currentPlayer.symbol;
            io.to(socket.room.name).emit('draw symbol', currentPlayer.symbol, destinationId);

            if (isWinner(socket.room.board, currentPlayer.symbol)) {
                io.to(socket.room.name).emit('winner', currentPlayer.symbol);
                io.to(currentPlayer.id).emit('win', true);
                io.to(opponent.id).emit('win', false);

                players[socket.room.host.id].inGame = false;
                players[socket.room.guest.id].inGame = false;
                io.emit('playerList', players);

                // leaving game room
                allClients[socket.room.host.id].leave(socket.room.name);
                allClients[socket.room.guest.id].leave(socket.room.name);
            } else if (isDraw(socket.room.board)) {
                io.to(socket.room.name).emit('draw');
            } else {
                io.to(currentPlayer.id).emit('switch turn', currentPlayer.canMove);
                io.to(opponent.id).emit('switch turn', opponent.canMove);
            }
        }
    });

    function isWinner (board, symbol) {
        var horizontal = checkIfEqual(board[0], board[1], board[2], symbol) || checkIfEqual(board[3], board[4], board[5], symbol) || checkIfEqual(board[6], board[7], board[8], symbol);
        var vertical = checkIfEqual(board[0], board[3], board[6], symbol) || checkIfEqual(board[1], board[4], board[7], symbol) || checkIfEqual(board[2], board[5], board[8], symbol);
        var cross = checkIfEqual(board[0], board[4], board[8], symbol) || checkIfEqual(board[2], board[4], board[6], symbol);

        return horizontal || vertical || cross;
    }

    function checkIfEqual (a, b, c, symbol) {
        return a === b && a === c && a === symbol;
    }

    function isDraw (board) {
        return board.indexOf('') === -1;
    }

    socket.on('disconnect', function () {
        // todo: check if player was playing with someone and emit to opponent message about that

        if (socket.player && socket.player.inGame) {
            console.log('Oops, somebody is disconnecting during the game. We should inform his opponent about that!');
        }

        delete players[socket.id];
        delete allClients[socket.id];

        io.emit('playerList', players);
        io.emit('userCounter', Object.keys(allClients).length);
        console.log('user count:', Object.keys(allClients).length);
        console.log('player count:', Object.keys(players).length);
    });
});

server.listen(port, function () {
    console.log('Listening on port', port);
});

// TODO LIST - features
// [X] switching turn
// [X] hide players list when play
// [X] show only available players on the list
// [X] win algorythm fix
// [X] draw support
// [?] support multiple boards
// [] leave room and end game when player disconnected
// [] player name validation
// [] store game stats in file or DB

// TODO LIST - refactor
// [X] do not pass whole html element through websocket
// [] divide server and client into separate files
// [] use react