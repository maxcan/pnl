'use strict';

// Declare app level module which depends on filters, and services
// example code.  starting out own now...
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/view1', {templateUrl: 'partials/partial1.html', controller: MyCtrl1});
    $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: MyCtrl2});
    $routeProvider.otherwise({redirectTo: '/view1'});
  }]);

angular.module('pnlApp', ['pnlApp.filters', 'pnlApp.services', 'pnlApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', { templateUrl: 'partials/pnlapp.html'
                                 , controller: HomeCtrl});
    $routeProvider.when('/trades/:tradeId', {templateUrl: 'partials/tradeDtl.html', controller: MyCtrl2});
    $routeProvider.otherwise({redirectTo: '/home'});
  }]);
