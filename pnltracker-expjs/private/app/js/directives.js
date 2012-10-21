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
          if (c) {window.scrollTo(c.left, c.top - 60);}
          return false;
        }
      }
    }
  });




// override the default input to update on blur
pnlApp.directive('tagBox', function() { 
  return { restrict: 'C'
  , link: function(scope, elm, attr, ngModelCtrl) {
      if (attr.type === 'radio' || attr.type === 'checkbox') return;
      elm.unbind('input').unbind('keydown').unbind('change');
      elm.bind("input", function(event) {
        console.log('changed');  // _DEBUG
          scope.curSymFilter = elm.val();
          scope.filterChanged();
          scope.$digest();
      });
      elm.bind("keypress", function(event) {
        console.log('key press: ' + event.which);  // _DEBUG
        if (event.which === 13) {
            scope.curSymFilter = ''; 
            scope.addSymFilter(elm.val());
            elm.val('');
          scope.$digest();
          // ngModelCtrl.$setViewValue(elm.val());
        } 
      });

      elm.bind('blur', function() {
        scope.curSymFilter = ''; 
        scope.addSymFilter(elm.val());
        elm.val('');
          scope.$digest();
      });
    }
  };
});
