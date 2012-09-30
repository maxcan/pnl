'use strict';

/* Filters */

var pnlApp = angular.module('pnlApp.filters', []);

pnlApp.filter('pluck', function() {
  return function(arr, fld) {
    var newArr = [];
    for (var k in arr) {
      newArr.push(arr[k][fld]);
    }; 
    return newArr;
  }  
});


pnlApp.filter('sum', function() {
  return function(arr, fld) {
    var total = 0;
    for (var k in arr) {
      total += Number(arr[k]);                
    }; 
    return total;
  }  
});

pnlApp.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }]);

pnlApp.filter('timespan', function() {
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


pnlApp.filter('pp', function() {
    return function(obj) {
      if (typeof(obj) === 'array' || typeof(obj) === 'object') {
        var ret = '<dl>';
        for (var k in obj) {
          ret += '<dt>'+k+'</dt><dd>'+obj[k]+'</dd>';
        }
        ret += '</dl>';
        return ret;
      } else { 
        return obj;
      }
    }
  })  ;

