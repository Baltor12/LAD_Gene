var app = angular.module('myApp', []);
app.controller('mainController', function ($scope) {

    /*============================================Variables============================================*/

    /*----------------------------------------------tab Variables--------------------------------------*/
    $scope.mainTab = {
        ioVisibility: true,
        ladderVisibility: false
    };

    $scope.ladderTab = {
        transVisible: true,
        funcVisible: false
    };

    $scope.ioTab = {
        inpVis: true
    };

    $scope.inputs = [
        { name: 'start', tag: 'FS', id: 1 },
        { name: '', tag: '', id: 2 }
    ];

    $scope.outputs = [
        { name: '', tag: '', id: 1 }
    ];

    $scope.inId = 3;

    $scope.outId = 2;

    /*================================================================================================*/

    /*============================================Functions============================================*/

    /*----------------------------------------------main tab functions--------------------------------*/

    /** 
    * Function which is performed when the main tab is pressed
    */
    $scope.mainTabChange = function (data) {
        //Get the element of the tab for modifying its class based on the selection
        var myEl = angular.element(document.getElementById('main-tab').getElementsByTagName("li"));
        //Initialize all to not selected (ie:empty)
        myEl[0].className = '';
        myEl[1].className = '';
        myEl[2].className = '';
        if (data === 'io') {
            $scope.mainTab.ioVisibility = true;
            $scope.mainTab.ladderVisibility = false;
            myEl[0].className = 'selected';
        } else if (data === 'fc') {
            $scope.mainTab.ioVisibility = false;
            $scope.mainTab.ladderVisibility = false;
            myEl[1].className = 'selected';
        } else {
            $scope.mainTab.ioVisibility = false;
            $scope.mainTab.ladderVisibility = true;
            myEl[2].className = 'selected';
        }
    };

    /** 
    * Function which is performed when the tab in the ladder spaces is pressed
    */
    $scope.ladderTabChange = function (data) {
        //Get the element of the tab for modifying its class based on the selection
        var myEl = angular.element(document.getElementById('ladder-tab').getElementsByTagName("li"));
        //Initialize all to not selected (ie:empty)
        myEl[0].className = '';
        myEl[1].className = '';
        myEl[2].className = '';
        if (data === 'tr') {
            $scope.ladderTab.transVisible = true;
            $scope.ladderTab.funcVisible = false;
            myEl[0].className = 'selected';
        } else if (data === 'fn') {
            $scope.ladderTab.transVisible = false;
            $scope.ladderTab.funcVisible = true;
            myEl[1].className = 'selected';
        } else {
            $scope.ladderTab.transVisible = false;
            $scope.ladderTab.funcVisible = false;
            myEl[2].className = 'selected';
        }
    };

    /*----------------------------------------------I/O tab functions--------------------------------*/

    /** 
    * Function which is performed when the the I/O tab is pressed
    */
    $scope.ioTabChange = function (data) {
        if (data === 'input') {
            $scope.ioTab.inpVis = true;
        } else {
            $scope.ioTab.inpVis = false;
        }
    };

    /** 
    * Function which is performed when the add input button is pressed
    */
    $scope.addInput = function () {
        //Push the input details to the array
        $scope.inputs.push({ name: '', tag: '', id: $scope.inId++ });
    };

    /** 
    * Function which is performed when the delete input button is pressed
    */
    $scope.deleteInput = function (data) {
        // Check which input is to be deleted and remove that one from the array
        for (i = 0; len = $scope.inputs.length, i < len; i++) {
            // Check based on the id supplied form the input
            if ($scope.inputs[i].id === data) {
                //remove the particular element
                if (i > -1) {
                    $scope.inputs.splice(i, 1);
                    len = $scope.inputs.length;
                }
            }
        }
    };

    /** 
     * Function which is performed when the add output button is pressed
     */
    $scope.addOutput = function () {
        //Push the output details to the array
        $scope.outputs.push({ name: '', tag: '', id: $scope.outId++ });
    };

    /** 
     * Function which is performed when the delete output button is pressed
     */
    $scope.deleteOutput = function (data) {
        // Check which output is to be deleted and remove that one from the array
        for (i = 0; len = $scope.outputs.length, i < len; i++) {
            // Check based on the id supplied form the output
            if ($scope.outputs[i].id === data) {
                //remove the particular element
                if (i > -1) {
                    $scope.outputs.splice(i, 1);
                    len = $scope.outputs.length;
                }
            }
        }
    };

    /*================================================================================================*/
});