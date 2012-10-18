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

pnlApp.filter('maxLen', function() {
  return function(str, len) {
    if (typeof(str) === 'string') return str.substring(str, (len ? len : 64));
    return str;
  }
});

pnlApp.filter('percent', function() {
  return function(num) { return(Math.round(num * 100)+ ' %'); }  
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

pnlApp.filter('count', function() { return function(arr) { return arr.length; }});

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
      if (days > 0) return String(days + " Days, " + hours + "h " + mins + "m " + secs + "." + mills +'s'); 
      if (hours > 0) return String(hours + "h " + mins + "m " + secs + "." + mills +'s'); 
      return String(mins + "m " + secs + "." + mills +'s'); 
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

// pnlApp.filter('getPnlByDuration', function() {
//   return function(trades) {
//     var getBucket = function(t) {
//       if (t.duration < 60 * 1000) return "<1min";
//       if (t.duration < 60 * 60 * 1000) return "1min<  <1hr";
//       if (t.duration < 5 * 60 * 60 * 1000) return "1hr<  <5hr";
//       if (t.duration < 24 * 60 * 60 * 1000) return "5hr<  <1day";
//       return ">1day";
//     }
//     var closedTrades = _.filter(trades, function(t){return !t.isOpen;});
//     var groupedTrades = _.groupBy(closedTrades, getBucket);
//     var buckets = [];
//     _.each(groupedTrades, function(group, bucket) { 
//       var nc = _.reduce(group, function(s,t) {return s+t.netCash;},0);
//       buckets.unshift({bucket:bucket, netCash:nc});
//     });
//     return buckets;
//   }
// });
// 
// pnlApp.filter('getPnlByUnderlying', function() {
//   return function(trades) {
//     var tradesByUnderlyingArr = [];
//     var tradesByUnderlying = {};
//     _.each(trades, function(curTrade) {
//       if (!curTrade.isOpen) {
//         var sym = ( curTrade.underlyingSecurity 
//           ? curTrade.underlyingSecurity.symbol
//           : curTrade.security.symbol);
//         if (tradesByUnderlying[sym]) {
//           tradesByUnderlying[sym] += curTrade.netCash;
//         } else {
//           tradesByUnderlying[sym] = curTrade.netCash;
// 
//         }
//       }
//     });
//     _.each(tradesByUnderlying, function(nc,sym) {
//       tradesByUnderlyingArr.unshift({sym:sym, netCash:nc});
//     });
// 
//     return tradesByUnderlyingArr;
//   }
// });
