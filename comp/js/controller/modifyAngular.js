var app = angular.module('modifyApp', []);

app.controller('modifyController', ['$scope', '$window', '$http', function ($scope, $window, $http) {
    $scope.progNameArr = $window.progName;
    $scope.programUser = $window.progUser;

    $scope.progVar = {
        progName: '',
        editButton: true,
        deleteButton: true
    };

    //Enable edit and delete button once the programe is selected
    $scope.progChange = function () {
        if ($scope.progVar.progName != '') {
            $scope.progVar.editButton = false;
            $scope.progVar.deleteButton = false;
        }
    };
    //Function performed when edit button is pressed.
    // Hiding the buttons and refreshing the list selected value
    $scope.editSelect = function () {
        if ($scope.progVar.progName != '') {
            $scope.progVar.editButton = true;
            $scope.progVar.deleteButton = true;
            $scope.progVar.progName = '';
        }
    };

    //Function performed when delete button is pressed.
    // It requests to the server for deleting the program
    $scope.deleteSelect = function () {
        if ($scope.progVar.progName != '') {
            $scope.progVar.editButton = true;
            $scope.progVar.deleteButton = true;
            var data = { user: $scope.programUser, programName: $scope.progVar.progName };
            $http.post("/delete", data).success(function (data, status) {
                $scope.progVar.progName = '';
                $scope.progNameArr = data.programArr;
            });
        }
    };
}]);