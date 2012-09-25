'use strict';

angular.module('pnlApp', ['pnlApp.filters', 'pnlApp.services', 'pnlApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', { templateUrl: 'partials/pnlapp.html'
                                 , controller: HomeCtrl});
    $routeProvider.when('/trades/:tradeId', {templateUrl: 'partials/tradeDtl.html', controller: TradeDtlCtrl});
    $routeProvider.otherwise({redirectTo: '/home'});
  }]);
