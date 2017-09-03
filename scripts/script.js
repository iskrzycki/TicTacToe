var elem = document.getElementById('myCanvas'),
    context = elem.getContext('2d'),
    elements = [],
    elemBounding = elem.getBoundingClientRect(),
    moveNumber = 0;

// Add event listener for `click` events.
elem.addEventListener('click', function(event) {
    var x = event.pageX - elemBounding.left,
        y = event.pageY - elemBounding.top;

    var selectedElem = getClickedElement(x, y);
    if (selectedElem) {
        moveNumber++;
        selectedElem.isBlank = false;

        if (moveNumber %2 == 0) {
            drawCircle(selectedElem);
        } else {
            drawX(selectedElem);
        }
    }

}, false);

function getClickedElement (x, y) {
    for (var i = 0, len = elements.length; i < len ; i++) {
        if (y > elements[i].top && y < elements[i].top + elements[i].height && x > elements[i].left && x < elements[i].left + elements[i].width && elements[i].isBlank) {
           return elements[i];
        }
    }
}

// Add element.
elements.push({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    id: 1,
    isBlank: true
});
elements.push({
    width: 100,
    height: 100,
    top: 0,
    left: 105,
    id: 2,
    isBlank: true
});
elements.push({
    width: 100,
    height: 100,
    top: 0,
    left: 210,
    id: 3,
    isBlank: true
});
elements.push({
    width: 100,
    height: 100,
    top: 105,
    left: 0,
    id: 4,
    isBlank: true
});
elements.push({
    width: 100,
    height: 100,
    top: 105,
    left: 105,
    id: 5,
    isBlank: true
});
elements.push({
    width: 100,
    height: 100,
    top: 105,
    left: 210,
    id: 6,
    isBlank: true
});
elements.push({
    width: 100,
    height: 100,
    top: 210,
    left: 0,
    id: 7,
    isBlank: true
});
elements.push({
    width: 100,
    height: 100,
    top: 210,
    left: 105,
    id: 8,
    isBlank: true
});
elements.push({
    width: 100,
    height: 100,
    top: 210,
    left: 210,
    id: 9,
    isBlank: true
});
// Render elements.
elements.forEach(function(element) {
    context.fillStyle = '#f1f1f1';
    context.fillRect(element.left, element.top, element.width, element.height);
});

function drawCircle(element) {
    var radius = element.width / 3;
    var x = element.left + element.width / 2;
    var y = element.top + element.height / 2;

    context.strokeStyle = 'green';
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
    context.lineTo(element.left + element.width - offset, element.top + element.height - offset);

    context.moveTo(element.left + element.width - offset, element.top + offset);
    context.lineTo(element.left + offset, element.top + element.height - offset);

    context.lineWidth = 10;
    context.strokeStyle = '#ff0000';
    context.stroke();
    context.closePath();
}
