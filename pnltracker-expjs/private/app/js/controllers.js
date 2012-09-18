'use strict';

/* Controllers */

// old example controllers from angular
function MyCtrl1() {}
MyCtrl1.$inject = [];


function MyCtrl2() {
}
MyCtrl2.$inject = [];

function HomeCtrl($scope, User, Trades) {
  $scope.user = User.get();
  $scope.trades = Trades.get();
}
