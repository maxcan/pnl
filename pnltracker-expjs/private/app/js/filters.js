'use strict';

/* Filters */

angular.module('pnlApp.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }]).

  filter('timespan', function() {
    return function(text) {
      var totalTime=  Number(text);
      var mills = totalTime % 1000;
      var secs  = Math.floor((totalTime % ( 60 * 1000 ) ) / 1000) ;
      var mins  = Math.floor((totalTime % ( 60 * 60 * 1000 ) ) / (60 * 1000));
      var hours = Math.floor((totalTime % ( 24 * 60 * 60 * 1000 ) ) / (60 * 60 * 1000));
      var days  = Math.floor(totalTime / ( 24 * 60 * 60 * 1000));
      return String(days + " Days, " + hours + ":" + mins + ":" + secs + "." + mills); 
    }
  })  ;
