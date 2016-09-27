
// holds all objects
var objects = [];

//Socket Io
var socket = io();

var objectId = '';

var canvas;
var scrollDiv;
var ctx;
var WIDTH;
var HEIGHT;
var INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed

var isDrag = false;
var isConLine = false;
var lastLinePtX = 0, lastLinePtY = 0;
var lineStObjGuid = null;
var lineParentGuid = null;
var mx, my; // mouse coordinates
var canvasX, canvasY; //specially tracked for determining the mouse coordinates while adding new objects

// when set to true, the canvas will redraw everything
// invalidate() just sets this to false right now
// we want to call invalidate() whenever we make a change
var canvasValid = false;

//for the right click menu
var canvMenu;
var objMenu;

//For the I/O Menu
var inpMenu;
var outMenu;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned into an array
var mySel;

// The selection color and width. Right now we have a red selection with a small width
var mySelColor = '#009999';
var mySelWidth = 3;

// we use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx; // fake canvas context

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

/**
 * Box object to hold data for all drawn rects
 */
function Box() {
    this.type = 'rect';
    this.text = '';
    this.x = 0;
    this.y = 0;
    this.w = 1; // default width and height?
    this.h = 1;
    this.id = '';
    this.nextObjGuids = [];
    this.fill = '#444444';
    this.tag = '';
    this.state = '';
}

/**
 * Circle object to hold data for all drawn circle
 */
function circle() {
    this.id = '';
    this.nextObjGuids = [];
    this.type = 'circ';
    this.text = '';
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.w = 0;
    this.h = 0;
    this.conStPt = false;
    this.conEndPt = false;
    this.conNo = 1;
    this.parentId = '';
    this.fill = '#444444';
    this.stroke = 'transparent';
}

/**
 * Diamond object to hold data for all drawn circle
 */
function diamond() {
    this.type = 'desc';
    this.nextObjGuids = [];
    this.text = '';
    this.x = 0;
    this.y = 0;
    this.w = 150;
    this.h = 140;
    this.id = '';
    this.fill = '#444444';
    this.tag = '';
    this.state = '';
}

/**
 * Object that determines the attributes for connecting line
 */
function line() {
    this.stObjParentGuid = '';
    this.stObjGuid = '';
    this.endObjGuid = '';
    this.endObjParentGuid = '';
    this.type = 'line';
    this.stroke = '#000';
    this.strokeWidth = 4;
    this.fill = '#000';
    this.connflowType = true; //especially to determine if the ooneting line is for False flow of decision box
}

/**
 * Initialize a new Box, add it, and invalidate the canvas
 */
function addRect(id, x, y, w, h, fill) {
    var rect = new Box;
    rect.id = id;
    rect.x = x;
    rect.y = y;
    rect.w = w
    rect.h = h;
    rect.fill = fill;
    objects.push(rect);
    invalidate();
}

/**
 * Initialize a new Start Circle, add it, and invalidate the canvas
 */
function addCirc(id, x, y, r, text, fill, stroke, conStPt, conNo, conEndPt, parentId) {
    var circ = new circle;
    circ.id = id;
    circ.x = x;
    circ.text = text;
    circ.y = y;
    circ.r = r;
    circ.w = r * 2;
    circ.h = r * 2;
    circ.conStPt = conStPt;
    circ.conNo = conNo;
    circ.conEndPt = conEndPt;
    circ.parentId = parentId;
    circ.fill = fill;
    circ.stroke = stroke;
    objects.push(circ);
    invalidate();
}

/**
 * Initialize a new Decision, add it, and invalidate the canvas
 */
function addDecis(id, x, y, fill) {
    var diam = new diamond;
    diam.id = id;
    diam.x = x;
    diam.y = y;
    diam.fill = fill;
    objects.push(diam);
    invalidate();
}

/**
 * Initialize a new Line, add it, and invalidate the canvas
 */
function addline(id, stObjGuid, endObjGuid, stObjParentGuid, endObjParentGuid, connflowType) {
    var lin = new line;
    lin.id = id;
    lin.stObjGuid = stObjGuid;
    lin.endObjGuid = endObjGuid;
    lin.stObjParentGuid = stObjParentGuid;
    lin.endObjParentGuid = endObjParentGuid;
    lin.connflowType = connflowType;
    objects.unshift(lin);
    invalidate();
}

/**
 * initialize our canvas, add a ghost canvas, set draw loop
 * then add everything we want to intially exist on the canvas
 */
function init() {
    canvMenu = document.getElementById('canvas-menu');
    objMenu = document.getElementById('object-menu');
    inpMenu = document.getElementById('input-select');
    outMenu = document.getElementById('output-select');
    canvas = document.getElementById('canvas');
    scrollDiv = document.getElementById("scrollDiv");
    HEIGHT = canvas.height;
    WIDTH = canvas.width;
    ctx = canvas.getContext('2d');
    ghostcanvas = document.createElement('canvas');
    ghostcanvas.height = HEIGHT;
    ghostcanvas.width = WIDTH;
    gctx = ghostcanvas.getContext('2d');

    //fixes a problem where double clicking causes text to get selected on the canvas
    //canvas.onselectstart = function () { return false; }

    // fixes mouse co-ordinate problems when there's a border or padding
    // see getMouse for more detail
    if (document.defaultView && document.defaultView.getComputedStyle) {
        stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
        stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
        styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
        styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
    }

    // make draw() fire every INTERVAL milliseconds
    setInterval(draw, INTERVAL);

    // set our events. Up and down are for dragging,
    // double click is for making new objects
    canvas.onmousedown = myDown;
    canvas.onmouseup = myUp;
    canvas.ondblclick = myDblClick;
    canvas.oncontextmenu = rightClick;
    canvas.onselectstart = myDblClick;

    //Get the GUID for start, assign it to both Start and the connector
    var startGuid = guid();

    // add a Start circle
    addCirc(startGuid, 400, 90, 40, 'Start', '#33FF33', 'transparent', false, 0, false, '');

    // add a Connector(Start-bottom) circle for Start
    addCirc(guid(), 400, 130, 5, '', 'transparent', 'transparent', true, 1, false, startGuid);

    //Get the GUID for end, assign it to both End and the connector
    var endGuid = guid();

    // add a End circle
    addCirc(endGuid, 300, 90, 40, 'End', '#FF6666', 'transparent', false, 0, false, '');

    // add a Connector(End-top) circle for End
    addCirc(guid(), 300, 50, 5, '', 'transparent', 'transparent', false, 0, true, endGuid);

}

/**
 * wipes the canvas context
 */
function clear(c) {
    c.clearRect(0, 0, WIDTH, HEIGHT);
}

/**
 * While draw is called as often as the INTERVAL variable demands,
 * It only ever does something if the canvas gets invalidated by our code
 */
function draw() {
    if (canvasValid == false) {
        clear(ctx);

        //initially draw the shapes
        for (var i = 0; i < objects.length; i++) {
            if ((!objects[i].conStPt) && (!objects[i].conEndPt)) {
                drawshape(ctx, objects[i]);
            }
        }

        // draw selection
        // right now this is just a stroke along the edge of the selected box
        if ((mySel != null) && (!mySel.conStPt) && (!mySel.conEndPt)) {
            ctx.strokeStyle = mySelColor;
            ctx.lineWidth = mySelWidth;
            //Based on the type create Selection stroke
            switch (mySel.type) {
                case 'rect':
                case 'desc':
                    ctx.strokeRect(mySel.x, mySel.y, mySel.w, mySel.h);
                    break;
                case 'circ':
                    ctx.strokeRect(mySel.x - (mySel.r), mySel.y - (mySel.r), (mySel.r * 2), (mySel.r * 2));
                    break;
            }

            //Change the color of the Start connector circle associated with the current object
            for (var i = 0; i < objects.length; i++) {
                if ((objects[i].conStPt) && (objects[i].parentId == mySel.id)) {
                    objects[i].fill = '#99CCFF';
                    objects[i].stroke = '#009999';
                } else if (objects[i].conStPt) {
                    //Make rest of the Start connectors transparent
                    objects[i].fill = 'transparent';
                    objects[i].stroke = 'transparent';
                }
            }
        } else if ((mySel != null) && (mySel.conStPt)) {
            var parentObjfrSel = null;
            for (var i = 0; i < objects.length; i++) {
                if (isConLine && (objects[i].conEndPt)) {
                    //Make the End Connectors visible
                    //Unlike the start connector where only one for the object are made visbile, the end connectors of all the objects are made visible
                    objects[i].fill = '#66FF66';
                    objects[i].stroke = '#009900';
                } else if (objects[i].conEndPt) {
                    //Make the End Connectors inVisible
                    objects[i].fill = 'transparent';
                    objects[i].stroke = 'transparent';
                } if (objects[i].id == mySel.parentId) {
                    parentObjfrSel = objects[i];
                }
            }
            //Draw a border around the parent to makke it has been selected
            if (parentObjfrSel != null) {
                ctx.strokeStyle = mySelColor;
                ctx.lineWidth = mySelWidth;
                //Based on the type create Selection stroke
                switch (parentObjfrSel.type) {
                    case 'rect':
                    case 'desc':
                        ctx.strokeRect(parentObjfrSel.x, parentObjfrSel.y, parentObjfrSel.w, parentObjfrSel.h);
                        break;
                    case 'circ':
                        ctx.strokeRect(parentObjfrSel.x - (parentObjfrSel.r), parentObjfrSel.y - (parentObjfrSel.r), (parentObjfrSel.r * 2), (parentObjfrSel.r * 2));
                        break;
                }
            }
        } else {
            //Again if no object is selected make all the connectors transparent
            for (var i = 0; i < objects.length; i++) {
                if ((objects[i].conStPt) || ((objects[i].conEndPt) && (!isConLine))) {
                    //if (objects[i].conStPt) {
                    objects[i].fill = 'transparent';
                    objects[i].stroke = 'transparent';
                }
            }
        }

        // Add stuff you want drawn in the background all the time here

        // draw all objects
        for (var i = 0; i < objects.length; i++) {
            if ((objects[i].conStPt) || (objects[i].conEndPt)) {
                drawshape(ctx, objects[i]);
            }
        }

        // Add stuff you want drawn on top all the time here
        canvasValid = true;
    }
}

/**
 * Function that is used while drawing connecting lines
 */
function drawLine(x, y) {
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.moveTo(lastLinePtX, lastLinePtY);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.stroke();
    lastLinePtX = x; lastLinePtY = y;
}

/**
 * Draws a single shape to a single context 
 * draw() will call this with the normal canvas
 * myDown will call this with the ghost canvas
 */
function drawshape(context, shape) {
    context.fillStyle = shape.fill;

    // We can skip the drawing of elements that have moved off the screen:
    if (shape.x > WIDTH || shape.y > HEIGHT) return;
    if (shape.x + shape.w < 0 || shape.y + shape.h < 0) return;

    //Based on the type create shape
    switch (shape.type) {
        case 'rect':
            context.fillRect(shape.x, shape.y, shape.w, shape.h);
            var font = 'bold 16px serif';
            context.fillStyle = 'white';
            context.font = font;
            context.textBaseline = 'top';
            context.fillText(shape.text, shape.x + 20, shape.y + 20);
            break;
        case 'circ':
            if ((shape.conStPt) || (shape.conEndPt)) {
                var parentObj = null;
                //Get the parent object
                for (var i = 0; i < objects.length; i++) {
                    if (shape.parentId == objects[i].id) {
                        parentObj = objects[i];
                    }
                }
                if (parentObj != null) {
                    var conX = 0, conY = 0;
                    //determine the X and Y poins for the connectors
                    switch (parentObj.type) {
                        case 'rect':
                            if (shape.conStPt) {
                                conX = parentObj.x + (parentObj.w / 2);
                                conY = parentObj.y + parentObj.h;
                            } else {
                                conX = parentObj.x + (parentObj.w / 2);
                                conY = parentObj.y;
                            }
                            break;
                        case 'desc':
                            // Incase of first connector it will be in the bottom
                            // Else it will be in the sides
                            if ((shape.conStPt) && (shape.conNo == 1)) {
                                conX = parentObj.x + (parentObj.w / 2);
                                conY = parentObj.y + parentObj.h;
                            } else if ((shape.conStPt) && (shape.conNo == 2)) {
                                conX = parentObj.x + (parentObj.w);
                                conY = parentObj.y + (parentObj.h / 2);
                            } else if (shape.conEndPt) {
                                conX = parentObj.x + (parentObj.w / 2);
                                conY = parentObj.y;
                            }
                            break;
                        case 'circ':
                            if (shape.conStPt) {
                                conX = parentObj.x;
                                conY = parentObj.y + parentObj.r;
                            } else {
                                conX = parentObj.x;
                                conY = parentObj.y - parentObj.r;
                            }
                            break;
                    }
                    //set the new position variables for children object
                    for (var i = 0; i < objects.length; i++) {
                        if (shape.id == objects[i].id) {
                            shape.x = conX;
                            shape.y = conY;
                        }
                    }
                    if ((conX != 0) && (conY != 0)) {
                        context.beginPath();
                        context.arc(conX, conY, shape.r, 0, 2 * Math.PI, true);
                        context.fill();
                        context.lineWidth = '2';
                        context.strokeStyle = shape.stroke;
                        context.stroke();
                    }
                }
            } else {
                context.beginPath();
                context.arc(shape.x, shape.y, shape.r, 0, 2 * Math.PI, true);
                context.fill();
                var font = 'bold ' + shape.r / 2 + 'px serif';
                context.fillStyle = 'white';
                context.font = font;
                context.textBaseline = 'top';
                context.fillText(shape.text, shape.x - shape.r / 2, shape.y - shape.r / 3);
            }
            break;
        case 'desc':
            context.beginPath();
            context.moveTo(shape.x + (shape.w / 2), shape.y);
            context.lineTo(shape.x + shape.w, shape.y + (shape.h / 2));
            context.lineTo(shape.x + (shape.w / 2), shape.y + shape.h);
            context.lineTo(shape.x + 0, shape.y + (shape.h / 2));
            context.closePath();
            context.fill();
            var font = '18px serif';
            context.fillStyle = 'white';
            context.font = font;
            context.textBaseline = 'top';
            context.fillText(shape.text, shape.x + 40, shape.y + 60);
            break;
        case 'line':
            if ((shape.stObjGuid != '') && (shape.endObjGuid != '')) {
                context.beginPath();
                context.strokeStyle = shape.stroke;
                context.lineWidth = shape.strokeWidth;
                var stObjX = 0, stObjY = 0, endObjX = 0, endObjY = 0, descCon = false;
                for (var i = 0; i < objects.length; i++) {
                    if (shape.stObjGuid == objects[i].id) {
                        stObjX = objects[i].x;
                        stObjY = objects[i].y;
                        if (objects[i].type == 'circ') {
                            if ((objects[i].conStPt) && (objects[i].conNo == 2)) {
                                descCon = true;
                            }
                        }
                    } else if (shape.endObjGuid == objects[i].id) {
                        endObjX = objects[i].x;
                        endObjY = objects[i].y;
                    }
                }
                context.moveTo(stObjX, stObjY);
                // Making the angled lines to a horizontal and vertical combination
                if ((stObjX == endObjX) && (endObjY > stObjY)) {
                    context.lineTo(stObjX + 30, stObjY);
                    context.moveTo(stObjX + 30, stObjY);
                    context.lineTo(stObjX + 30, endObjY);
                    context.moveTo(stObjX + 30, endObjY);
                } else if (stObjX < endObjX) {
                    //calculate the midpoint for drawing the vertical line
                    if ((endObjY > stObjY) || (descCon)) {
                        var midPoint = (endObjX - stObjX) / 2;
                    } else {
                        var midPoint = 100;
                    }
                    context.lineTo(stObjX + midPoint, stObjY);
                    context.moveTo(stObjX + midPoint, stObjY);
                    context.lineTo(stObjX + midPoint, endObjY);
                    context.moveTo(stObjX + midPoint, endObjY);
                } else if (stObjX > endObjX) {
                    //calculate the midpoint for drawing the vertical line
                    if ((endObjY > stObjY) || (descCon)) {
                        var midPoint = (endObjX - stObjX) / 2;
                    } else {
                        var midPoint = -100;
                    }
                    context.lineTo(stObjX - midPoint, stObjY);
                    context.moveTo(stObjX - midPoint, stObjY);
                    context.lineTo(stObjX - midPoint, endObjY);
                    context.moveTo(stObjX - midPoint, endObjY);
                }
                context.lineTo(endObjX, endObjY);
                //Arrow at the end of each line
                context.lineTo(endObjX - 7, endObjY - 12);
                context.lineTo(endObjX + 7, endObjY - 12);
                context.lineTo(endObjX, endObjY);
                context.closePath();
                context.fill();
                context.stroke();
                break;
            }
    }
}

/**
 * Happens when the mouse is moving inside the canvas
 */
function myMove(e) {
    if (isDrag) {
        getMouse(e);

        mySel.x = mx - offsetx;
        mySel.y = my - offsety;

        // something is changing position so we better invalidate the canvas!
        invalidate();
    } else if (isConLine) {
        //Get the mouse points
        getMouse(e);

        //Draw the line
        drawLine(mx, my);
    }
}

/**
 *  Happens when the mouse is clicked in the canvas
 */
function myDown(e) {
    if ((canvMenu.style.display == 'none') && (canvMenu.style.display == 'none') && (e.which == 1)) {
        //Get Position
        getMouse(e);
        clear(gctx);
        for (var i = objects.length - 1; i >= 0; i--) {
            // draw shape onto ghost context
            drawshape(gctx, objects[i]);

            // get image data at the mouse x,y pixel
            var imageData = gctx.getImageData(mx, my, 1, 1);

            // if the mouse pixel exists, select and break
            if (imageData.data[3] > 0) {
                mySel = objects[i];
                offsetx = mx - mySel.x;
                offsety = my - mySel.y;
                mySel.x = mx - offsetx;
                mySel.y = my - offsety;
                //If connector point then ignore dragging and draw the lines
                if (!mySel.conStPt) {
                    isConLine = false;
                    isDrag = true;
                    canvas.onmousemove = myMove;
                    invalidate();
                    clear(gctx);
                } else {
                    // Enable all the end connector points 
                    // this is done inorder to let know the users that those are tthe avialble end points for a connecting line
                    isConLine = true;
                    invalidate();
                    //Associate the point to start from for a line
                    lastLinePtX = mx;
                    lastLinePtY = my;
                    lineStObjGuid = mySel.id;
                    lineParentGuid = mySel.parentId;
                    canvas.onmousemove = myMove;
                }
                return;
            }
        }
        //Disable the connecting line
        isConLine = false;
        // havent returned means we have selected nothing
        mySel = null;
        // clear the ghost canvas for next time
        clear(gctx);
        // invalidate because we might need the selection border to disappear
        invalidate();
    }
}

/**
 * Function that is responsible when the mouse click is released
 */
function myUp(e) {
    // Remove Context menus
    canvMenu.style.display = 'none';
    objMenu.style.display = 'none';
    isDrag = false;
    canvas.onmousemove = null;

    //calculate the mouse pointer position 
    if (isConLine) {
        getMouse(e);
        // get image data at the mouse x,y pixel
        for (var i = objects.length - 1; i >= 0; i--) {
            if (objects[i].conEndPt) {
                var calSpaceX = Math.round(objects[i].x - objects[i].r);
                var calSpaceY = Math.round(objects[i].y - objects[i].r);
                if ((mx >= calSpaceX) && (mx <= (calSpaceX + (2 * objects[i].r))) && (my >= calSpaceY) && (my <= (calSpaceY + (2 * objects[i].r)))) {
                    var stParentObjId = '';
                    var connflowType = true;
                    var endParentObjId = objects[i].parentId;
                    //Find the parent object of the starting and ending connection point 
                    for (var j = 0; j < objects.length; j++) {
                        if (objects[j].id == lineStObjGuid) {
                            stParentObjId = objects[j].parentId;
                            for (var k = 0; k < objects.length; k++) {
                                if (objects[k].id == objects[j].parentId) {
                                    //add the parent guid of the end point connector to the current object
                                    objects[k].nextObjGuids.push(objects[i].parentId);
                                }
                            }
                            //Set if the line is for the false end of the decision box
                            if (objects[j].conNo == 2) {
                                connflowType = false;
                            }
                        }
                    }
                    //addline to the objects list
                    addline(guid(), lineStObjGuid, objects[i].id, stParentObjId, endParentObjId, connflowType);
                    invalidate();
                    return;
                }
            }
        }
    }
}

/**
 * adds a new node
 */
function myDblClick(e) {
    //Enable the input or output selection options based on the double click
    if (mySel != null) {
        if (mySel.type == 'desc') {
            //enable the input options
            inpMenu.style.display = 'block';
            //Hide the output options
            outMenu.style.display = 'none';
        } else if (mySel.type == 'rect') {
            //Enable the output options
            outMenu.style.display = 'block';
            //Hide the input options
            inpMenu.style.display = 'none';
        } else {
            //Hide the input options
            inpMenu.style.display = 'none';
            //Hide the output options
            outMenu.style.display = 'none';
        }
    } else {
        //Hide the input options
        inpMenu.style.display = 'none';
        //Hide the output options
        outMenu.style.display = 'none';
    }
}

function invalidate() {
    canvasValid = false;
}

/**
 * Sets mx,my to the mouse position relative to the canvas
 */
function getMouse(e) {
    var element = canvas, offsetX = 0, offsetY = 0;

    if (element.offsetParent) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }

    // Add padding and border style widths to offset
    offsetX += stylePaddingLeft;
    offsetY += stylePaddingTop;

    offsetX += styleBorderLeft;
    offsetY += styleBorderTop;

    mx = e.pageX - offsetX + scrollDiv.scrollLeft;
    my = e.pageY - offsetY + scrollDiv.scrollTop;
}

/**
 * Function that is executed while the mouse right click happens 
*/
function rightClick(e) {
    var disp = false;
    canvasX = parseInt(e.clientX);
    canvasY = parseInt(e.clientY);
    for (var i = 0; i < objects.length; i++) {
        if ((canvasX >= objects[i].x) && (canvasX <= (objects[i].x + objects[i].w))
            && (canvasY >= objects[i].y) && (canvasY <= (objects[i].y + objects[i].h))) {
            disp = true;
            objectId = objects[i].id;
        }
    }
    if (disp) {
        //Hide the Canvas menu if it has been already been enabled
        canvMenu.style.display = 'none';
        menuDisp(objMenu, e);
    } else {
        //re-initialize the object Id to empty since the object has not been selected (for the fail safe scenario)
        objectId = '';
        objMenu.style.display = 'none';
        menuDisp(canvMenu, e);
    }
    return false;
}

/**
 * Function that is used to display custom menu
 */
function menuDisp(custMenu, e) {
    // Initiall the menu is made to disappear if ther is something that exists already.
    custMenu.style.display = 'none';
    custMenu.style.display = 'block';
    //Get the position  
    custMenu.style.left = e.pageX + 'px';
    custMenu.style.top = e.pageY + 'px';
}

/**
 * Function for Deleting a Canvas element 
 */
function deleteCanvas() {
    //Hide the Right custom menu
    objMenu.style.display = 'none';
    var arrIndex = -1;
    //Finding the index of the object with the particular id in the Objects array
    for (var i = 0; i < objects.length; i++) {
        if (objectId == objects[i].id) {
            arrIndex = i;
        }
    }
    if (arrIndex != -1) {
        //Removing the Object if it is available in the Objects array
        objects.splice(arrIndex, 1);
        //Redraw the complete canvas
        canvasValid = false;
        //The selection is made invalid inorder to remove all the reference to that element.
        mySel = null;
        draw();
    }
}

/**
 * Function for Adding a element (either Decision box / processing Box) 
 * This functionality can be later expanded to add more shapes
 */
function addObj(obj) {
    //Hide the Right custom menu
    objMenu.style.display = 'none';
    //Based on the options add the object
    var addedGUID = guid();
    switch (obj) {
        case 'desc':
            addDecis(addedGUID, canvasX, canvasY, '#2BB8FF');
            // Add a Connector circle for the object
            // Initial position doesnt really matter as they are hidden
            addCirc(guid(), 0, 0, 5, '', 'transparent', 'transparent', true, 2, false, addedGUID);
            break;
        case 'rect':
            addRect(addedGUID, canvasX, canvasY, 150, 80, '#FFC02B');
            break;
    }
    // Add a Connector circle for the object
    // Initial position doesnt really matter as they are hidden
    addCirc(guid(), 0, 0, 5, '', 'transparent', 'transparent', true, 1, false, addedGUID);

    // add a Connector(End-top) circle for End
    addCirc(guid(), 0, 0, 5, '', 'transparent', 'transparent', false, 0, true, addedGUID);
    //hide the custom menu
    canvMenu.style.display = 'none';
}

/**
 * Function to generate the guid for each objects
 */
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

/**
 * Function to clear all the connecting lines
 */
function clearLines() {
    var arrIndexs = [];
    for (var i = 0; i < objects.length; i++) {
        if (objects[i].type == 'line') {
            arrIndexs.push(i);
        }
    }
    if (arrIndexs.length != 0) {
        for (var i = arrIndexs.length - 1; i >= 0; i--) {
            //Removing the Object if it is available in the Objects array
            objects.splice(arrIndexs[i], 1);
        }
        //Redraw the complete canvas
        invalidate();
    }
    //hide the custom menu
    canvMenu.style.display = 'none';
}

/**
 * Function to assign selected values to the canvas text
 */
function assignText(type) {
    //First check whether it is input or output.
    //In case of input it is assigned to the decision box
    //In case of output it is assigned to the processing box
    if (type == 'input') {
        //Get the values from the selectin box
        var inTag = document.getElementById("in-tag");
        var inState = document.getElementById("in-state");
        //Get the element which has been selected currently
        for (var i = 0; i < objects.length; i++) {
            if ((mySel.id == objects[i].id) && (objects[i].type == 'desc')) {
                objects[i].tag = inTag.options[inTag.selectedIndex].text;
                objects[i].state = inState.options[inState.selectedIndex].text;
                objects[i].text = inTag.options[inTag.selectedIndex].text + ':' + inState.options[inState.selectedIndex].text + '?';
                //invalidate the canvas to redraw all the components
                invalidate();
            }
        }
    } else {
        var outTag = document.getElementById("out-tag");
        var outState = document.getElementById("out-state");
        //Get the element which has been selected currently
        for (var i = 0; i < objects.length; i++) {
            if ((mySel.id == objects[i].id) && (objects[i].type == 'rect')) {
                objects[i].tag = outTag.options[outTag.selectedIndex].text;
                objects[i].state = outState.options[outState.selectedIndex].text;
                objects[i].text = outTag.options[outTag.selectedIndex].text + ':' + outState.options[outState.selectedIndex].text;
                //invalidate the canvas to redraw all the components
                invalidate();
            }
        }
    }
    //Hide the input options
    inpMenu.style.display = 'none';
    //Hide the output options
    outMenu.style.display = 'none';
}

/**
 * Function that forwards the complete logic of the Flowchart to backend server for further processing
 */
function sendJson() {
    // Get input and output details from JSON
    var domEl = document.querySelector('[ng-controller="mainController"]');
    var ngEl = angular.element(domEl);
    var ngElScope = ngEl.scope();

    //Generate logic jason with input, outputs from Angular and flowchart details form current javascript
    var logicJson = { 'objects': objects, 'inputs': ngElScope.inputs, 'outputs': ngElScope.outputs };
    console.log(logicJson);
    //Emit the Json to backend
    socket.emit("logic", logicJson);
}



