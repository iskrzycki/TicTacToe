var socket = io();

var elem = document.getElementById('myCanvas');
var context = elem.getContext('2d');
var elemBounding;
var elements = [];
var moveNumber = 0;
var playerName;
var symbol; // should not be here...

var CONFIG = {
    BOARD: {
        TILE_SIZE: 100,
        TILE_COLOR: '#f1f1f1'
    },
    X_COLOR: '#ff0000',
    O_COLOR: '#00ff00'
};

document.querySelector("#nameForm").addEventListener("submit", function(e) {
    e.preventDefault();
    var input = document.getElementById('playerNameInput');
    socket.emit('newPlayer', input.value);
    playerName = input.value;
    document.getElementById('nameForm').remove();
    displayPlayers(true);
});

elem.addEventListener('click', function(event) {
    elemBounding = elem.getBoundingClientRect();
    var x = event.pageX - elemBounding.left;
    var y = event.pageY - elemBounding.top;

    var selectedElem = getClickedElement(x, y);
    if (selectedElem) {
        socket.emit('move', selectedElem);
    }

}, false);

socket.on('draw', function (data, elem) {
    if (data === 'x') {
        drawX(elem);
    } else if (data === 'o') {
        drawCircle(elem);
    }
});

socket.on('winner', function () {
    document.getElementById('winnerInfo').innerHTML = "SOMEBODY WON";
    displayPlayers(true);
    displayBoard(false);
    // todo: end game here
});

socket.on('switch turn', function (data) {
    if (symbol === data) {
        elem.className = "touchable";
    } else {
        elem.className = "dont-touch";
    }
});

socket.on('userCounter', function (count) {
    document.getElementById('userCounter').innerHTML = "users online: " + count;
});

socket.on('startGame', function (data) {
    displayBoard(true);
    displayPlayers(false);
    document.getElementById('roomName').innerHTML = data.name;
    console.log('start game');
});

socket.on('symbol', function (data) {
    symbol = data.playerType;
});

socket.on('playerList', function (playerList) {
    var ul = document.getElementById('player-list');

    while(ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    for (var property in playerList) {
        if (playerList.hasOwnProperty(property)) {
            var li = document.createElement("li");
            var text = playerList[property].name;

            if (playerList[property].inGame === true) {
                text += " - in game";
            }

            li.appendChild(document.createTextNode(text));
            li.setAttribute("id", playerList[property].id);
            if (playerName !== playerList[property].name && playerList[property].inGame === false) {
                li.addEventListener("click", function(e) {
                    socket.emit('createRoom', e.srcElement.getAttribute("id"));
                }, false);
            } else {
                li.className += 'disable-player';
            }
            ul.appendChild(li);
        }
    }

    // for (var i = 0, len = playerList.length; i < len ; i++) {
    //     var li = document.createElement("li");
    //     var text = playerList[i].name;

    //     if (playerList[i].inGame === true) {
    //         text += " - in game";
    //     }

    //     li.appendChild(document.createTextNode(text));
    //     li.setAttribute("id", playerList[i].id);
    //     if (playerName !== playerList[i].name || playerList[i].inGame === true) {
    //         li.addEventListener("click", function(e) {
    //             socket.emit('createRoom', e.srcElement.getAttribute("id"));
    //         }, false);
    //     } else {
    //         li.className += 'disable-player';
    //     }
    //     ul.appendChild(li);
    // }
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

// Render elements.
elements.forEach(function(element) {
    context.fillStyle = CONFIG.BOARD.TILE_COLOR;
    context.fillRect(element.left, element.top, CONFIG.BOARD.TILE_SIZE, CONFIG.BOARD.TILE_SIZE);
});

function drawCircle(element) {
    var radius = CONFIG.BOARD.TILE_SIZE / 3;
    var x = element.left + CONFIG.BOARD.TILE_SIZE / 2;
    var y = element.top + CONFIG.BOARD.TILE_SIZE / 2;

    context.strokeStyle = CONFIG.O_COLOR;
    context.beginPath();
    context.arc(x, y, radius, 0, 2*Math.PI);

    context.lineWidth = 10;
    context.stroke();
    context.closePath();
}

function drawX(element) {
    var offset = 20;

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

window.onbeforeunload = function() {
    // TODO: Uncomment on prod
    //return "Do you really want to refresh page? You'll be logged out.";
}

function displayBoard (isVisible) {
    var displayStyle = isVisible ? 'block' : 'none';
    document.getElementById('board').style.display = displayStyle;
}

function displayPlayers (isVisible) {
    var displayStyle = isVisible ? 'block' : 'none';
    document.getElementById('players-panel').style.display = displayStyle;
}