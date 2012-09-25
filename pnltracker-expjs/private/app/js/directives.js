'use strict';

/* Directives */


var pnlModule = angular.module('pnlApp.directives', []);

pnlModule.directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) { elm.text(version); };
  }]);
pnlModule.directive('appUpload', function () {
    return {  templateUrl: 'partials/upload.html' };
  });

