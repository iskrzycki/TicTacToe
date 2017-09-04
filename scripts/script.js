var socket = io();

var elem = document.getElementById('myCanvas'),
    context = elem.getContext('2d'),
    elements = [],
    elemBounding = elem.getBoundingClientRect(),
    moveNumber = 0;

    var CONFIG = {
        BOARD: {
            TILE_SIZE: 100,
            TILE_COLOR: '#f1f1f1'
        },
        X_COLOR: '#ff0000',
        O_COLOR: '#00ff00'
    };

document.querySelector("#nameForm").addEventListener("submit", function(e) {
    var input = document.getElementById('playerNameInput');
    socket.emit('newPlayer', input.value);
});

elem.addEventListener('click', function(event) {
    var x = event.pageX - elemBounding.left;
    var y = event.pageY - elemBounding.top;

    var selectedElem = getClickedElement(x, y);
    if (selectedElem) {
        moveNumber++;
        selectedElem.isBlank = false;

        if (moveNumber %2 == 0) {
            socket.emit('draw', 'o', selectedElem);
        } else {
            socket.emit('draw', 'x', selectedElem);
        }
    }

}, false);

socket.on('draw', function (data, elem) {
    if (data === 'x') {
        drawX(elem);
    } else if (data === 'o') {
        drawCircle(elem);
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
elements.push({top: 0, left: 0, id: 1, isBlank: true});
elements.push({top: 0, left: 105, id: 2, isBlank: true});
elements.push({top: 0, left: 210, id: 3, isBlank: true});
elements.push({top: 105, left: 0, id: 4, isBlank: true});
elements.push({top: 105, left: 105, id: 5, isBlank: true});
elements.push({top: 105, left: 210, id: 6, isBlank: true});
elements.push({top: 210, left: 0, id: 7, isBlank: true});
elements.push({top: 210, left: 105, id: 8, isBlank: true});
elements.push({top: 210, left: 210, id: 9, isBlank: true});

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
