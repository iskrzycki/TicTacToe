var socket = io();
var elemBounding;
var elements = [];
var moveNumber = 0;
var playerName;

var CONFIG = {
    BOARD: {
        TILE_SIZE: 100,
        TILE_COLOR: '#f1f1f1'
    },
    X_COLOR: '#ff0000',
    O_COLOR: '#00ff00'
};

var ELEMENTS = {
    SYMBOL_INFO: document.getElementById('symbolInfo'),
    USER_COUNTER: document.getElementById('userCounter'),
    CANVAS: document.getElementById('myCanvas'),
    PLAYER_INPUT: document.getElementById('playerNameInput'),
    PLAYER_FORM: document.getElementById('nameForm'),
    WINNER_INFO: document.getElementById('winnerInfo'),
    ROOM_NAME: document.getElementById('roomName'),
    BUTTON_LEAVE: document.getElementById('btnLeave'),
    ERROR_MESSAGE: document.getElementById('errorMessage'),
    PLAYER_LIST: document.getElementById('player-list'),
    TURN_INFO: document.getElementById('turnInfo'),
    BOARD: document.getElementById('board'),
    PLAYERS_PANEL: document.getElementById('players-panel'),
    NAME_FORM: document.getElementById('nameForm')
};

var context = ELEMENTS.CANVAS.getContext('2d');

ELEMENTS.NAME_FORM.addEventListener('submit', function (e) {
    e.preventDefault();
    socket.emit('newPlayer', ELEMENTS.PLAYER_INPUT.value);
});

socket.on('player name', function (name) {
    playerName = name;
    ELEMENTS.PLAYER_FORM.remove();
    displayPlayers(true);
    hideError();
});

ELEMENTS.CANVAS.addEventListener('click', function (event) {
    elemBounding = ELEMENTS.CANVAS.getBoundingClientRect();
    var x = event.pageX - elemBounding.left;
    var y = event.pageY - elemBounding.top;

    var selectedElem = getClickedElement(x, y);
    if (selectedElem) {
        socket.emit('move', selectedElem.id);
    }
}, false);

socket.on('draw symbol', function (data, destinationId) {
    if (data === 'x') {
        drawX(destinationId);
    } else if (data === 'o') {
        drawCircle(destinationId);
    }
});

socket.on('game result', function (wonSymbol) {
    displayWinnerInfo(true, wonSymbol);
    displayTurnInfo(false, false);
});

ELEMENTS.BUTTON_LEAVE.addEventListener('click', function () {
    socket.emit('leaveGame');
    displayWinnerInfo(false);
    displayTurnInfo(false, false);
    displayBoard(false);
    displayPlayers(true);
});

socket.on('disconnected', function () {
    displayErrorMessage('Game ended');
});

socket.on('switch turn', function (isYourTurn) {
    displayTurnInfo(true, isYourTurn);
});

socket.on('symbol', function (symbol) {
    ELEMENTS.SYMBOL_INFO.innerHTML = 'Your symbol: ' + symbol;
});

socket.on('userCounter', function (count) {
    ELEMENTS.USER_COUNTER.innerHTML = 'users online: ' + count;
});

socket.on('error', function (message) {
    displayErrorMessage(message);
});

socket.on('startGame', function (roomName) {
    ELEMENTS.WINNER_INFO.innerHTML = '';
    displayBoard(true);
    displayPlayers(false);
    ELEMENTS.ROOM_NAME.innerHTML = roomName;
    console.log('start game');
});

socket.on('playerList', function (playerList) {
    var ul = ELEMENTS.PLAYER_LIST;

    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    for (var player in playerList) {
        if (playerList.hasOwnProperty(player)) {
            var li = document.createElement('li');
            var text = playerList[player].name;

            if (playerList[player].inGame === true) {
                text += ' - in game';
            }

            li.appendChild(document.createTextNode(text));
            li.setAttribute('id', playerList[player].id);
            li.className = 'list-group-item touchable';

            if (playerName !== playerList[player].name && playerList[player].inGame === false) {
                li.addEventListener('click', function (e) {
                    socket.emit('createRoom', e.srcElement.getAttribute('id'));
                }, false);
            } else {
                li.className += ' disabled';
            }
            ul.appendChild(li);
        }
    }
});

function getClickedElement (x, y) {
    for (var i = 0, len = elements.length; i < len ; i++) {
        if (y > elements[i].top && y < elements[i].top + CONFIG.BOARD.TILE_SIZE && x > elements[i].left && x < elements[i].left + CONFIG.BOARD.TILE_SIZE && elements[i].isBlank) {
           return elements[i];
        }
    }
}

// Add element.
elements.push({top: 0, left: 0, id: 0, isBlank: true});
elements.push({top: 0, left: 105, id: 1, isBlank: true});
elements.push({top: 0, left: 210, id: 2, isBlank: true});
elements.push({top: 105, left: 0, id: 3, isBlank: true});
elements.push({top: 105, left: 105, id: 4, isBlank: true});
elements.push({top: 105, left: 210, id: 5, isBlank: true});
elements.push({top: 210, left: 0, id: 6, isBlank: true});
elements.push({top: 210, left: 105, id: 7, isBlank: true});
elements.push({top: 210, left: 210, id: 8, isBlank: true});

function drawBoard () {
    elements.forEach(function (element) {
        element.isBlank = true;
        context.fillStyle = CONFIG.BOARD.TILE_COLOR;
        context.fillRect(element.left, element.top, CONFIG.BOARD.TILE_SIZE, CONFIG.BOARD.TILE_SIZE);
    });
}

drawBoard();

function drawCircle (id) {
    var element = getGameElementById(id);
    var radius = CONFIG.BOARD.TILE_SIZE / 3;
    var x = element.left + CONFIG.BOARD.TILE_SIZE / 2;
    var y = element.top + CONFIG.BOARD.TILE_SIZE / 2;

    element.isBlank = false;
    context.strokeStyle = CONFIG.O_COLOR;
    context.beginPath();
    context.arc(x, y, radius, 0, 2*Math.PI);

    context.lineWidth = 10;
    context.stroke();
    context.closePath();
}

function drawX (id) {
    var element = getGameElementById(id);
    var offset = 20;

    element.isBlank = false;
    context.beginPath();
    context.moveTo(element.left + offset, element.top + offset);
    context.lineTo(element.left + CONFIG.BOARD.TILE_SIZE - offset, element.top + CONFIG.BOARD.TILE_SIZE - offset);

    context.moveTo(element.left + CONFIG.BOARD.TILE_SIZE - offset, element.top + offset);
    context.lineTo(element.left + offset, element.top + CONFIG.BOARD.TILE_SIZE - offset);

    context.lineWidth = 10;
    context.strokeStyle = CONFIG.X_COLOR;
    context.stroke();
    context.closePath();
}

window.onbeforeunload = function () {
    // TODO: Uncomment on prod
    //return 'Do you really want to refresh page? You'll be logged out.';
}

function displayErrorMessage (message) {
    ELEMENTS.ERROR_MESSAGE.style.display = 'block';
    ELEMENTS.ERROR_MESSAGE.innerHTML = message;
}

function hideError () {
    ELEMENTS.ERROR_MESSAGE.style.display = 'none';
}

function displayBoard (isVisible) {
    var displayStyle = isVisible ? 'block' : 'none';
    if (isVisible === true) {
        drawBoard();
    }
    ELEMENTS.BOARD.style.display = displayStyle;
}

function displayPlayers (isVisible) {
    var displayStyle = isVisible ? 'block' : 'none';
    ELEMENTS.PLAYERS_PANEL.style.display = displayStyle;
}

function displayWinnerInfo (isVisible, whoWon) {
    var displayStyle = isVisible ? 'block' : 'none';
    ELEMENTS.WINNER_INFO.style.display = displayStyle;
    if (isVisible === false) {
        return;
    }

    switch (whoWon) {
        case 'DRAW':
            ELEMENTS.WINNER_INFO.innerHTML = 'DRAW';
            break;
        case 'x':
        case 'o':
            ELEMENTS.WINNER_INFO.innerHTML = whoWon + ' WON';
            break;
        default:
            ELEMENTS.WINNER_INFO.innerHTML = '';
    }
}

function displayTurnInfo (isVisible, isYourTurn) {
    var displayStyle = isVisible ? 'block' : 'none';
    ELEMENTS.TURN_INFO.style.display = displayStyle;

    if (isYourTurn) {
        ELEMENTS.CANVAS.className = 'touchable';
        ELEMENTS.TURN_INFO.innerHTML = 'Your turn';
    } else {
        ELEMENTS.CANVAS.className = 'dont-touch';
        ELEMENTS.TURN_INFO.innerHTML = 'Opponent turn';
    }
}

function getGameElementById (id) {
    return elements.filter(function (elem) {
        return elem.id === id;
    })[0];
}