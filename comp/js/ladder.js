var socket = io();
//this is pinged inorder to delete the old HTML element and update with the new element
socket.on('ladder_details', function (data) {
    console.log(data);
    trans = data.trans;
    func = data.func;
    out = data.out;
    drawLadder();
});

/*=========================Variables=======================*/

var transCanvas, funCanvas, outCanvas;
var transCtx, funCtx, outCtx;
var trans = [], func = [], out = [];

/*=========================================================*/

/**
 * Function that draws the ladder diagram based on the ladder JSON
 */
function drawLadder() {
    transCanvas = document.getElementById('trans-canvas');
    funCanvas = document.getElementById('function-canvas');
    outCanvas = document.getElementById('output-canvas');
    transCtx = transCanvas.getContext('2d');
    funCtx = funCanvas.getContext('2d');
    outCtx = outCanvas.getContext('2d');

    //Refresh each canvas
    transCtx.clearRect(0, 0, transCanvas.width, transCanvas.height);
    funCtx.clearRect(0, 0, funCanvas.width, funCanvas.height);
    outCtx.clearRect(0, 0, outCanvas.width, outCanvas.height);

    //draw transaction rungs with its components
    drawCanvas(transCtx, trans);

    //draw Functions rungs with its components
    drawCanvas(funCtx, func);

    //draw output rungs with its components
    drawCanvas(outCtx, out);
};

/**
 * Function that draws components for functions, transactions and outputs in their own canvas
 */
function drawCanvas(ctx, comp) {
    var rungPosY = 10;
    var rungNo = 1;
    //draw output rungs with its components
    for (var i = 0; i < comp.length; i++) {
        //Draw the rung initially
        drawRung(rungPosY, ctx, rungNo);
        //Draw Output
        drawOutput(rungPosY + 50, ctx, comp[i].id, comp[i].type, comp[i].state);
        var inNo = 0;
        //draw sub-rungs for each function except the first ones
        //Also map the output in the rung/sub-rung 
        for (var j = 0; j < comp[i].rungs.length; j++) {
            var inputPosX = 70;
            //sub-rung
            if (j != 0) {
                //calculate the number of inputs in the sub-rung
                inNo = comp[i].rungs[j].close.length + comp[i].rungs[j].open.length + comp[i].rungs[j].sepClose.length + comp[i].rungs[j].sepOpen.length;
                //Also calculate the number of inputs in the next subrung and determine the length else the next subrung will be hanging
                for (var k = j; k < comp[i].rungs.length; k++) {
                    var tempInNo = comp[i].rungs[k].close.length + comp[i].rungs[k].open.length + comp[i].rungs[k].sepClose.length + comp[i].rungs[k].sepOpen.length;
                    if (tempInNo > inNo) {
                        inNo = tempInNo;
                    }
                }
                drawSubRung(rungPosY, ctx, inNo);
            }
            //draw inputs which are normally closed
            for (var k = 0; k < comp[i].rungs[j].close.length; k++) {
                drawInput(inputPosX, rungPosY + 50, ctx, true, comp[i].rungs[j].close[k]);
                //Increment the x position for inputs
                inputPosX += 55;
            }
            //draw inputs which are normally open            
            for (var k = 0; k < comp[i].rungs[j].open.length; k++) {
                drawInput(inputPosX, rungPosY + 50, ctx, false, comp[i].rungs[j].open[k]);
                //Increment the x position for inputs
                inputPosX += 55;
            }
            //Draw the inputs which will be seperated between sub-ring
            //Check if there is next subrung else no need to do any thing
            if (comp[i].rungs.length > j + 1) {
                //modify the X position based on the sub-ring Length
                inputPosX += subRingLength(comp[i].rungs[j + 1].close.length + comp[i].rungs[j + 1].open.length + comp[i].rungs[j + 1].sepClose.length + comp[i].rungs[j + 1].sepOpen.length);
            }
            //draw seperate inputs which are normally closed
            for (var k = 0; k < comp[i].rungs[j].sepClose.length; k++) {
                drawInput(inputPosX, rungPosY + 50, ctx, true, comp[i].rungs[j].sepClose[k]);
                //Increment the x position for inputs
                inputPosX += 55;
            }
            //draw sepearate inputs which are normally open            
            for (var k = 0; k < comp[i].rungs[j].sepOpen.length; k++) {
                drawInput(inputPosX, rungPosY + 50, ctx, false, comp[i].rungs[j].sepOpen[k]);
                //Increment the x position for inputs
                inputPosX += 55;
            }
            //update the rung no and Y position for next rung formation
            rungPosY += 100;
        }
        rungNo += 1;
    }
}

/**
 * Function that is used to draw the rung object
 * Its inputs are Y position, context and rung no
 */
function drawRung(y, ctx, no) {
    //Rung formation
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.moveTo(30, y);
    ctx.lineTo(30, y + 100);
    ctx.moveTo(30, y + 50);
    ctx.lineTo(730, y + 50);
    ctx.moveTo(730, y);
    ctx.lineTo(730, y + 100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    //Circle for the text no
    ctx.beginPath();
    ctx.setLineDash([5]);
    ctx.arc(13, y + 50, 12, 0, 2 * Math.PI, true);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.lineWidth = '1';
    ctx.strokeStyle = 'red';
    ctx.stroke();
    ctx.setLineDash([0]);

    //text
    var font = 'bold 14px arial';
    ctx.fillStyle = 'blue';
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.fillText('' + no + '', 8, y + 50);
    ctx.closePath();
}

/**
 * Function that draws the sub rungs to the main rung
 * Its inputs are Y position and Input Nos
 */
function drawSubRung(y, ctx, inNo) {
    if (inNo != 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.moveTo(30, y);
        ctx.lineTo(30, y + 100);
        ctx.moveTo(30, y + 50);
        var xPos = subRingLength(inNo);
        ctx.lineTo(xPos, y + 50);
        ctx.moveTo(xPos, y + 50);
        ctx.lineTo(xPos, y - 50);
        ctx.moveTo(730, y);
        ctx.lineTo(730, y + 100);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
}

/**
 * Function that draws the output in the main rung
 * the inputs are Y position and the output tag (text)
 */
function drawOutput(y, ctx, text, type, state) {
    //Circle
    ctx.beginPath();
    ctx.arc(680, y, 20, 0, 2 * Math.PI, true);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.lineWidth = '3';
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.closePath();
    //Text
    var font = 'bold 15px sans-serif';
    ctx.font = font;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 660, y - 40);
    if (type == 'output') {
        font = 'bold 23px sans-serif';
        ctx.font = font;
        if ((state != '') && (state == 'set')) {
            ctx.fillText("S", 673, y);
        } else if ((state != '') && (state == 'reset')) {
            ctx.fillText("R", 673, y);
        }
    }
    ctx.closePath();
}

/**
 * Function that draws the input object (both openand closed ones)
 * The inputs of the function are  
 */

function drawInput(x, y, ctx, isClosed, text) {
    //Rectangle with white/ background color for imitaing the input background
    ctx.beginPath();
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x, y - 20, 15, 40);
    ctx.fill();
    ctx.closePath();
    //lines
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y + 20);
    ctx.moveTo(x + 15, y - 20);
    ctx.lineTo(x + 15, y + 20);
    if (isClosed) {
        ctx.moveTo(x + 1, y - 19);
        ctx.lineTo(x + 14, y + 19);
    }
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    //Text
    var font = 'bold 15px sans-serif';
    ctx.font = font;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - 40);
    ctx.closePath();
}

/**
 * function that provides the sub-ring length
 */
function subRingLength(inNo) {
    return 70 + inNo * 55;
}

