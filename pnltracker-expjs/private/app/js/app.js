'use strict';

angular.module('pnlApp', ['pnlApp.filters', 'pnlApp.services', 'pnlApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', { templateUrl: 'partials/pnlapp.html' });
    $routeProvider.when('/trades/:tradeId'
                       , {templateUrl: 'partials/tradeDtl.html'
                         , controller: TradeDtlCtrl});
    $routeProvider.when('/admin'
                       , {templateUrl: 'partials/admin.html'
                         , controller: AdminCtrl});
    $routeProvider.otherwise({redirectTo: '/home'});
  }]);
