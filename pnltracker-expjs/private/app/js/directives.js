'use strict';

/* Directives */


var pnlModule = angular.module('pnlApp.directives', []);

pnlModule.directive('appVersion', ['version', function(version) {
  return function(scope, elm, attrs) { elm.text(version); };
}]);
pnlModule.directive('appUpload', function () {
  return {  templateUrl: 'partials/upload.html' };
});



pnlModule.directive('scrollTo', function(){
    return {
      restrict: 'A',
      replace: false, 
      transclude: false, 
      // The linking function will add behavior to the template
      link: function(scope, element, attrs) {
        // Clicking on title should open/close the zippy
        element.bind('click', fireScroll);
        if (!attrs.scrollTo) {
          console.log('missing scrollto');  // _DEBUG
        }
        // Toggle the closed/opened state
        function fireScroll() {
          var c = $(attrs.scrollTo).position();
          if (c) {window.scrollTo(c.left, c.top);}
          return false;
        }
      }
    }
  });
