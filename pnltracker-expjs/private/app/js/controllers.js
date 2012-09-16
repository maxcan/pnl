'use strict';

/* Controllers */

// old example controllers from angular
function MyCtrl1() {}
MyCtrl1.$inject = [];


function MyCtrl2() {
}
MyCtrl2.$inject = [];

function HomeCtrl() {

}
function UserCtrl($scope, User) {
  $scope.user = User.get();
}
