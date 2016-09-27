
/**
 * variable that holds the list of functions
 */
var funcList = [];

/**
 * variable that holds the list of transitions
 */
var transList = [];

/**
 * variable that holds the list of outputs
 */
var outptList = [];

/**
 * variable that holds the list of objects that can be associated to functions from the frontend objects
 */
var objFuncList = [];

/**
 * variable that holds the list of objects that can be associated to transitions from the frontend objects
 */
var objTransList = [];

var objList = [];
var lineList = [];

var funcId = 1;
var transId = 1;
var outputId = 1;

//function list for output 
var outFuncs = [];

// The modal Objects will be later used to form the complete lists of functions, transitions and outputs
// the Objects inside each model is associated in such a way that the frontend can build the ladder rungs directly from this model

/**
 * model object for function
 */
function func() {
    this.id = 0;
    this.rungs = [];
}

/**
 * model object for transition
 */
function trans() {
    this.id = 0;
    this.rungs = [];
}

/**
 * model object for output
 */
function outpt() {
    this.id = 0;
    this.rungs = [];
}

//Model object for sorting the functions and transitions from the list of objects from backend

/**
 * model object for Object function
 */
function objFunc() {
    this.id = 0;
    this.guid = '';
    this.parentGuid = '';
    this.type = '';
    this.input = '';
    this.output = '';
    this.state = '';
    this.frmTransIds = [];
    this.toTransIds = [];
    this.parentFnIds = [];
}

/**
 * model object for Object transition
 */
function objTrans() {
    this.id = 0;
    this.guid = '';
    this.frmFuncIds = [];
    this.toFuncId = '';
}

/**
 * function for adding function related objects
 */
function addFunc(id, rungs) {
    var funct = new func;
    funct.id = id;
    funct.rungs = rungs;
    funcList.push(funct);
}

/**
 * function for adding transition related objects
 */
function addTrans(id, rungs) {
    var transi = new trans;
    transi.id = id;
    transi.rungs = rungs;
    transList.push(transi);
}

/**
 * function for adding outputs related objects
 */
function addOutpt(id, rungs) {
    var output = new outpt;
    output.id = id;
    output.rungs = rungs;
    outptList.push(output);
}

/**
 * function for adding object function related objects
 */
function addObjFunc(id, guid, parentGuid, type, input, output, state) {
    var objectFunc = new objFunc;
    objectFunc.id = id;
    objectFunc.guid = guid;
    objectFunc.parentGuid = parentGuid;
    objectFunc.type = type;
    objectFunc.input = input;
    objectFunc.output = output;
    objectFunc.state = state;
    objFuncList.push(objectFunc);
}

/**
 * function for adding object transition related objects
 */
function addObjTrans(id, guid, frmFuncIds, toFuncId) {
    var objectTrans = new objTrans;
    objectTrans.id = id;
    objectTrans.guid = guid;
    objectTrans.frmFuncIds = frmFuncIds;
    objectTrans.toFuncId = toFuncId;
    //Remove the transactions if they are looped back
    var arrIndex = -1;
    for (var i = 0; i < objectTrans.frmFuncIds.length; i++) {
        if (objectTrans.frmFuncIds[i] == objectTrans.toFuncId) {
            arrIndex = i;
        }
    }
    if (arrIndex != -1) {
        objectTrans.frmFuncIds.splice(arrIndex, 1);
    }
    objTransList.push(objectTrans);
}

var objects;
var inputs;
var outputs;

//module that holds the logic responsible functions
module.exports = function (json, io) {
    //initialize variables
    funcList = [];
    transList = [];
    outptList = [];
    objList = [];
    objFuncList = [];
    objTransList = [];
    lineList = [];
    funcId = 1;
    transId = 1;
    outputId = 1;
    outFuncs = [];

    //============================variables==========================//

    /**
     * variables for each component from frontend Json
     */
    objects = json.objects;
    inputs = json.inputs;
    outputs = json.outputs;

    //=======================================================================//

    //Seperate objects (decision/Processing/Start/Stop) and lines into a seperate list
    //Lines
    for (var i = 0; i < objects.length; i++) {
        if (objects[i].type == 'line') {
            lineList.push(objects[i]);
        }
    }
    //objects
    for (var i = 0; i < objects.length; i++) {
        if (!(objects[i].type == 'line')) {
            if (objects[i].type == 'circ') {
                if ((!objects[i].conStPt) && (!objects[i].conEndPt)) {
                    objList.push(objects[i]);
                }
            } else {
                objList.push(objects[i]);
            }
        }
    }

    // First sort the functions from the objects 
    noObjectsAsFunctions();

    //Sort the Transactions from the objects
    noObjectsAsTransations();

    //Associate the transactions to the functions
    for (var i = 0; i < objFuncList.length; i++) {
        for (var j = 0; j < objTransList.length; j++) {
            if (objFuncList[i].id == objTransList[j].toFuncId) {
                objFuncList[i].frmTransIds.push(objTransList[j].id);
            }
            for (var k = 0; k < objTransList[j].frmFuncIds.length; k++) {
                if (objFuncList[i].id == objTransList[j].frmFuncIds[k]) {
                    objFuncList[i].toTransIds.push(objTransList[j].id);
                }
            }
        }
    }

    // Output rung formation
    for (var i = 0; i < objFuncList.length; i++) {
        var concurTrans = [];
        var doneConcurTrans = [];
        var output = '';
        if ((objFuncList[i].output != '') && (objFuncList[i].state == 'ON')) {
            outFuncs.push(objFuncList[i].id);
            output = objFuncList[i].output;
            concurTrans = outputElements(objFuncList[i], output);
            // Iterate for every transactions and add the functions for outputs
            while (concurTrans.length != 0) {
                var tempConcurrTrans = [];
                for (var m = 0; m < concurTrans.length; m++) {
                    for (var j = 0; j < objTransList.length; j++) {
                        if (objTransList.id == concurTrans[m]) {
                            //check if the function has already been added
                            //If not added then perform the adding operation
                            if (outFuncs.indexOf(objTransList[j].toFuncId) == -1) {
                                for (var k = 0; k < objFuncList.length; k++) {
                                    if (objTransList[j].toFuncId == objFuncList[k].id) {
                                        tempConcurrTrans = tempConcurrTrans.concat(outputElements(objFuncList[k], output));
                                    }
                                }
                            }
                        }
                    }
                }
                doneConcurTrans = doneConcurTrans.concat(concurTrans);
                //Remove duplicates in the concurrent transaction
                tempConcurrTrans = removeDuplicatesTrans(tempConcurrTrans);
                //check if the transactions have already been mapped
                //if yes then remove them and add the rest to the concurrent transaction
                concurTrans = removeDoneTransactions(doneConcurTrans, tempConcurrTrans);
            }
            var outFuncNames = [];
            for (var m = 0; m < outFuncs.length; m++) {
                outFuncNames.push({ 'open': ['F' + outFuncs[m]], 'close': [], 'sepOpen': [], 'sepClose': [] });
            }
            //Add the whole to the output list
            addOutpt(output, outFuncNames);
        }
    }

    //First scan/start button rung add


    //Transactions rung Formation
    for (var i = 0; i < objTransList.length; i++) {
        var transRungs = [];
        if (objTransList[i].id == 1) {
            for (var l = 0; l < inputs.length; l++) {
                if (inputs[l].id == 1) {
                    transRungs.push({ 'open': [inputs[l].tag], 'close': [], 'sepOpen': [], 'sepClose': [] });
                }
            }
        }
        if (objTransList[i].frmFuncIds.length != 0) {
            for (var j = 0; j < objTransList[i].frmFuncIds.length; j++) {
                for (var k = 0; k < objFuncList.length; k++) {
                    if (objFuncList[k].id == objTransList[i].frmFuncIds[j]) {
                        if (objFuncList[k].input != '') {
                            if (objFuncList[k].state == 'ON') {
                                transRungs.push({ 'open': ['F' + objFuncList[k].id, objFuncList[k].input], 'close': [], 'sepOpen': [], 'sepClose': [] });
                            } else {
                                transRungs.push({ 'open': ['F' + objFuncList[k].id], 'close': [objFuncList[k].input], 'sepOpen': [], 'sepClose': [] });
                            }
                        } else {
                            transRungs.push({ 'open': ['F' + objFuncList[k].id], 'close': [], 'sepOpen': [], 'sepClose': [] });
                        }
                    }
                }
            }
        }
        addTrans('T' + objTransList[i].id, transRungs);
    }

    //Function rung Formation
    for (var i = 0; i < objFuncList.length; i++) {
        var funcRungs = [];
        var notTrans = [];
        for (var j = 0; j < objFuncList[i].toTransIds.length; j++) {
            notTrans.push('T' + objFuncList[i].toTransIds[j]);
        }
        funcRungs.push({ 'open': ['F' + objFuncList[i].id], 'close': [], 'sepOpen': [], 'sepClose': notTrans });
        for (var j = 0; j < objFuncList[i].frmTransIds.length; j++) {
            funcRungs.push({ 'open': ['T' + objFuncList[i].frmTransIds[j]], 'close': [], 'sepOpen': [], 'sepClose': [] });
        }
        addFunc('F' + objFuncList[i].id, funcRungs);
    }

    io.sockets.emit('ladder_details', { 'trans': transList, 'func': funcList, 'out': outptList });
}

/**
 * Number the objects as flowchart methodology functions 
 */

function noObjectsAsFunctions() {
    var nextGuid = '';
    var concurrGuids = [];
    var parentGuid = '';
    //Find the first function from the start objects (basically the next object of start is the first function)
    for (var i = 0; i < objList.length; i++) {
        if (objList[i].text == 'Start') {
            nextGuid = objList[i].nextObjGuids[0];
            parentGuid = objList[i].id;
        }
    }
    //Map the objects with function no
    concurrGuids = mapFunctions(nextGuid, parentGuid);
    //Remove duplicates in the concurrent Guids 
    concurrGuids = removeDuplicatesFunc(concurrGuids);
    //Remove already mapped functions from the concurrent one
    concurrGuids = removeExistingFunctions(concurrGuids);

    //Repeat the process till all the functions have been mapped
    while (concurrGuids.length != 0) {
        var tempconcurrGuids = [];
        for (var i = 1; i < concurrGuids.length; i++) {
            nextGuid = concurrGuids[i].guid;
            parentGuid = concurrGuids[i].parentGuid;
            //Map the objects with function no and get the concurrents
            var concurrGuids1 = mapFunctions(nextGuid, parentGuid);
            //Append the array to the already existing one
            tempconcurrGuids.push.apply(tempconcurrGuids, concurrGuids1);
            //Remove duplicates in the concurrent Guids 
            tempconcurrGuids = removeDuplicatesFunc(concurrGuids);
            //Remove already mapped functions from the concurrent one
            tempconcurrGuids = removeExistingFunctions(concurrGuids);
        }
        concurrGuids = tempconcurrGuids;
    }
    //Associate the parent Function nos for each function (get that from the flowchart objects)
    for (var i = 0; i < objFuncList.length; i++) {
        for (var j = 0; j < objList.length; j++) {
            if (objList[j].nextObjGuids.indexOf(objFuncList[i].guid) > -1) {
                if (objList[j].text == 'Start') {
                    objFuncList[i].parentFnIds.push(0);
                }
                for (var k = 0; k < objFuncList.length; k++) {
                    if (objFuncList[k].guid == objList[j].id) {
                        objFuncList[i].parentFnIds.push(objFuncList[k].id);
                    }
                }
            }
        }
    }
}

/**
 * Mapping the objects to the functions
 */
function mapFunctions(nxtGuid, parntGuid) {
    var concurrGuids = [];
    //Make a loop so that all the objects will be mapped as the functions
    while (nxtGuid != '') {
        var flag = false;
        //initially check if the Function has already been added
        for (var i = 0; i < objFuncList.length; i++) {
            if (objFuncList[i].guid == nxtGuid) {
                flag = true;
            }
        }
        if (flag) {
            break;
        }
        var nxtId = '';
        // Add function to the list and get the next function Id form the same
        for (var i = 0; i < objList.length; i++) {
            if (nxtGuid == objList[i].id) {
                //add the object to the function list
                assignObject(objList[i], parntGuid);
                //Assign the next object to be added to the function
                if (objList[i].nextObjGuids.length != 0) {
                    //Same function may be the next one in case of decision box
                    if (objList[i].nextObjGuids[0] != objList[i].id) {
                        nxtId = objList[i].nextObjGuids[0];
                        //Since there may be one or more child/next object for the same object, these are also taken intoaccount for function numbering
                        //Basically the concurrent child are stored and retrieved later for numbering 
                        for (var j = 1; j < objList[i].nextObjGuids.length; j++) {
                            if (objList[i].nextObjGuids[j] != objList[i].id) {
                                concurrGuids.push(
                                    {
                                        'guid': objList[i].nextObjGuids[j],
                                        'parentGuid': objList[i].id
                                    }
                                );
                            }
                        }
                        //Assign the next parrent id to be the current one
                        parntGuid = objList[i].id;
                    } else {
                        if (objList[i].nextObjGuids.length > 1) {
                            nxtId = objList[i].nextObjGuids[1];
                            //Since there may be one or more child/next object for the same object, these are also taken intoaccount for function numbering
                            //Basically the concurrent child are stored and retrieved later for numbering 
                            for (var j = 2; j < objList[i].nextObjGuids.length; j++) {
                                if (objList[i].nextObjGuids[j] != objList[i].id) {
                                    concurrGuids.push(
                                        {
                                            'guid': objList[i].nextObjGuids[j],
                                            'parentGuid': objList[i].id
                                        }
                                    );
                                }
                            }
                            //Assign the next parrent id to be the current one
                            parntGuid = objList[i].id;
                        } else {
                            nxtId = '';
                        }
                    }
                } else {
                    nxtId = '';
                }
            }
        }
        nxtGuid = nxtId;
    }
    return concurrGuids;
}

/**
 * Function that is used to assign/ add an objects as function to the object function list
 */

function assignObject(object, parntGuid) {
    var flag = false;
    //Check if the object already exists as function in the object Function list
    for (var i = 0; i < objFuncList.length; i++) {
        if (objFuncList[i].guid == object.id) {
            flag = true;
        }
    }
    //if there is no flag then add the object to the Functions list
    if (!flag) {
        //if the object is a processing box, then the tag in output tag 
        //else if the object is a decision box, then the tag is input tag
        if (object.type == 'desc') {
            addObjFunc(funcId, object.id, parntGuid, object.type, object.tag, '', object.state);
            //increment the ID
            funcId += 1;
        } else if (object.type == 'rect') {
            addObjFunc(funcId, object.id, parntGuid, object.type, '', object.tag, object.state);
            //increment the ID
            funcId += 1;
        } else if (object.text == 'End') {
            addObjFunc(funcId, object.id, parntGuid, 'end', '', '', '');
            //increment the ID
            funcId += 1;
        }
    }
}

/**
 * Function to remove duplicate array values
 */

function removeDuplicatesFunc(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) {
        obj[arr[i].guid] = arr[i];
    }
    arr = [];
    for (var key in obj) {
        arr.push(obj[key]);
    }
    return arr;
}

/**
 * Function that removes items in concurrent list with the already existing objects in the object function list
 */

function removeExistingFunctions(concurrGuids) {
    for (var i = 0; i < objFuncList.length; i++) {
        var arrIndex = -1;
        for (var j = 1; j < concurrGuids.length; j++) {
            if (objFuncList[i].guid == concurrGuids[j].guid) {
                arrIndex = i;
            }
        }
        if (arrIndex != -1) {
            concurrGuids.splice(arrIndex, 1);
        }
    }
    return concurrGuids;
}

/**
 * Function to remove duplicate array values
 */

function removeDuplicatesTrans(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) {
        obj[arr[i]] = true;
    }
    arr = [];
    for (var key in obj) {
        arr.push(key);
    }
    return arr;
}

//TODO: look at the iterating transactions 

/**
 * Function that maps the connecting line objects to transactions
 */
function noObjectsAsTransations() {
    //Initially the mapping is done based on the Function number list
    for (var i = 0; i < objFuncList.length; i++) {
        var arrIndex = -1;
        for (var j = 0; j < lineList.length; j++) {
            if ((lineList[j].endObjParentGuid == objFuncList[i].guid) && (lineList[j].stObjParentGuid == objFuncList[i].parentGuid) && (lineList[j].connflowType)) {
                //Check if a similar transaction already exists
                //ie to function(child function) is the same
                var flagB = true;
                for (var k = 0; k < objTransList.length; k++) {
                    if (objTransList[k].toFuncId == objFuncList[i].id) {
                        flagB = false;
                    }
                }
                if (flagB) {
                    //Number the connecting line and add it to the object transation list
                    addObjTrans(transId, lineList[j].id, objFuncList[i].parentFnIds, objFuncList[i].id);
                    transId += 1;
                }
                //Occurance number of the connecting line
                arrIndex = j;
            }
            //the already mapped Connecting line is removed from the object list
            if (arrIndex != -1) {
                lineList.splice(arrIndex, 1);
            }
        }
    }
}

/**
 * Function that sorts the functional element for each output 
 */
function outputElements(objFunc, out) {
    var concurTrans = [];
    var contLoop = true;
    //Continue the loop till the output state of the function is 'OFF' 
    //OR: if there is no more function to proceed (ie: it is the end function)
    //OR: if the function is already added as the loop.
    while (contLoop) {
        if (objFunc.toTransIds.length != 0) {
            for (var k = 0; k < objTransList.length; k++) {
                if (objTransList[k].id == objFunc.toTransIds[0]) {
                    //Store the concurrent transitions
                    for (var m = 1; m < objFunc.toTransIds.length; m++) {
                        concurTrans.push(objFunc.toTransIds[m]);
                    }
                    //Check if the function already exists 
                    if (outFuncs.indexOf(objTransList[k].toFuncId) == -1) {
                        for (var l = 0; l < objFuncList.length; l++) {
                            if (objFuncList[l].id == objTransList[k].toFuncId) {
                                if ((objFuncList[l].output == out) && (objFuncList[l].state == 'OFF')) {
                                    contLoop = false;
                                } else {
                                    if (objFuncList[l].type == 'end') {
                                        contLoop = false;
                                    } else {
                                        objFunc = objFuncList[l];
                                    }
                                    outFuncs.push(objFuncList[l].id);
                                }
                            }
                        }
                    } else {
                        contLoop = false;
                    }
                }
            }
        } else {
            contLoop = false;
        }
    }
    //remove duplicates in concurrent transitions
    concurTrans = removeDuplicatesTrans(concurTrans);
    return concurTrans;
}

/**
 * Function that compares two transaction arrays and removes the existing component    
 */

function removeDoneTransactions(doneTransArr, tempTransArr) {
    var obj = {};
    for (var i = 0; i < tempTransArr.length; i++) {
        if (doneTransArr.indexOf(tempTransArr[i]) == -1) {
            obj[tempTransArr[i]] = true;
        }
    }
    arr = [];
    for (var key in obj) {
        arr.push(key);
    }
    return arr;
}




