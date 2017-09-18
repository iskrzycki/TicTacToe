var fs = require('fs')
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = 3000;

var logger = fs.createWriteStream('log.txt', {
  flags: 'a'
})

var players = {};
var allClients = {};

app.use('/scripts', express.static(__dirname + '/scripts'));
app.use('/styles', express.static(__dirname + '/styles'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

function logToFile (message) {
    // todo: uncomment on prod
    //var curretDate = new Date();
    //logger.write(curretDate.toUTCString() + '     ' + message + '\r\n');
}

io.on('connection', function (socket) {
    allClients[socket.id] = socket;

    io.emit('userCounter', Object.keys(allClients).length);
    io.emit('playerList', players);
    console.log('user connected', socket.id);
    console.log('user count:', Object.keys(allClients).length);
    logToFile('user connected ' + socket.id);

    socket.on('newPlayer', function (name) {

        if (validateUserName(name)) {
            var player = {
                name: name,
                id: socket.id,
                inGame: false
            }
            socket.player = player;
            console.log('New player: ', player.name);
            players[socket.id] = player;
            io.to(socket.id).emit('player name', player.name);
            io.emit('playerList', players);
        } else {
            io.to(socket.id).emit('error', 'Invalid username');
        }
    });

    socket.on('createRoom', function (secondPlayerId) {
        var secondPlayerSocket = io.sockets.sockets[secondPlayerId];
        var roomName = socket.player.name + ' vs ' + secondPlayerSocket.player.name;
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
        io.to(socket.id).emit('symbol', 'x');
        io.to(secondPlayerSocket.id).emit('symbol', 'o');
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
            currentPlayer.canMove = false;
            opponent.canMove = true;

            socket.room.board[destinationId] = currentPlayer.symbol;
            io.to(socket.room.name).emit('draw symbol', currentPlayer.symbol, destinationId);

            if (isWinner(socket.room.board, currentPlayer.symbol)) {
                io.to(socket.room.name).emit('game result', currentPlayer.symbol);

                players[socket.room.host.id].inGame = false;
                players[socket.room.guest.id].inGame = false;
                io.emit('playerList', players);

                // leaving game room
                allClients[socket.room.host.id].leave(socket.room.name);
                allClients[socket.room.guest.id].leave(socket.room.name);
            } else if (isDraw(socket.room.board)) {
                io.to(socket.room.name).emit('game result', 'DRAW');
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
        if (socket.player && socket.player.inGame) {
            io.to(socket.room.name).emit('disconnected');
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

function validateUserName (userName) {
    if (userName.length === 0) {
        return false;
    }
    for (var player in players) {
        if (players.hasOwnProperty(player)) {
            if (players[player].name === userName) {
                return false;
            }
        }
    }
    return true;
}

// TODO LIST - features
// [X] switching turn
// [X] hide players list when play
// [X] show only available players on the list
// [X] win algorythm fix
// [X] draw support
// [X] info panel - player name, who's turn, player stats
// [?] support multiple boards
// [?] player name validation (needs to be handled on ui side also)
// [?] leave room and end game when player disconnected
// [] store game stats in file or DB
// [] draw line when somebody won
// [] allow user to return to player list
// [] allow user to exit game

// TODO LIST - refactor
// [X] do not pass whole html element through websocket
// [] divide server and client into separate files
// [] use react
// [] style info panel better (your symbol...)