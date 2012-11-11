
angular.module('pnlApp', ['ui', 'pnlApp.filters', 'pnlApp.services', 'pnlApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home',    { templateUrl: 'partials/pnlapp.html' });
    $routeProvider.when('/compare', { templateUrl: 'partials/compare.html' });
    $routeProvider.when('/upload',  { templateUrl: 'partials/tradeUpload.html' });
    // $routeProvider.when('/trades/:tradeId'
    //                    , {templateUrl: 'partials/tradeDtl.html'
    //                      , controller: TradeDtlCtrl});
    $routeProvider.when('/admin'
                       , {templateUrl: 'partials/admin.html'
                         , controller: AdminCtrl});
    $routeProvider.otherwise({redirectTo: '/home'});
  }]);
