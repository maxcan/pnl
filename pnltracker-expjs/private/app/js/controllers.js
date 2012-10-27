'use strict';

// utility functions
function closedTrades (trades) {
  return _.filter(trades, function(t){return !t.isOpen;});
}

function AuthCodeCtrl($rootScope, $scope, $http) { 
  $scope.submitAuthCode = function() {
    $http.post('../../api/user/authcode', {authcode: $scope.authcode})
         .success(function() {
           $('#authCodeEntryModal').modal('hide');
           $rootScope.$broadcast('refreshTrades');
           alert('Successfully Authorized');
         })
         .error(function(d, s) {
           console.log('error setting code: ' + d + ': status = ' + s);
           alert('failed to authorize');
         });
  };

}
function mkGenericGroup(trades, groupingFunction) {
  var groupedTrades = _.groupBy(closedTrades(trades), groupingFunction);
  var buckets = [];
  _.each(groupedTrades, function(group, bucket) { 
    var nc = _.reduce(group, function(s,t) {return s+t.netCash;},0);
    var ret = { group: bucket
              , netCash: nc
              , cntTotal: 0
              , cntGain: 0
              , cntLoss: 0};
    _.each(group, function(t) { 
      ret.cntTotal++;
      if (t.netCash > 1) { ret.cntGain++;}
      else if (t.netCash < -1) { ret.cntLoss++;}
    });
    ret.cntScratch = ret.cntTotal - (ret.cntGain + ret.cntLoss);
    ret.pctWin = ret.cntGain / ret.cntTotal;
    buckets.unshift(ret);
  });
  return buckets;
}

function DurationGroupCtrl($scope, Trades, $rootScope) {
  var toggleReverseSort = true;
  var sortCol = null;
  $scope.setSort = function(col) {
    sortCol = col;
    toggleReverseSort = !toggleReverseSort;
    sortRows();
  };
  function sortRows() {
    if (!sortCol) return ; 
    $scope.groups = _.sortBy($scope.groups, sortCol);
    if (toggleReverseSort) $scope.groups.reverse();
  }
  function mkDuration(trades) {
    return mkGenericGroup(trades,  function(t) {
      if (t.duration < 60 * 1000)                 return "Less than 1 min";
      if (t.duration < 60 * 60 * 1000)            return "1 min to 1 hr";
      if (t.duration < 5 * 60 * 60 * 1000)        return "1 hr to 5 hrs";
      if (t.duration < 24 * 60 * 60 * 1000)       return "5 hrs to 1 day";
      if (t.duration < 7 * 24 * 60 * 60 * 1000)   return "1 day to 1 week";
      return "More than 1 week";
    });
  }
  $rootScope.$on('loadedTrades', function() {
    $scope.groups = mkDuration($scope.$parent.filteredClosedTrades); 
    sortRows();
  });
}

function UndlGroupCtrl($scope, $rootScope) {
  var toggleReverseSort  = true;
  var sortCol = null;
  $scope.setSort = function(col) {
    sortCol = col;
    toggleReverseSort = !toggleReverseSort;
    sortRows();
  };
  function sortRows() {
    if (!sortCol) return ; 
    $scope.groups = _.sortBy($scope.groups, sortCol);
    if (toggleReverseSort) $scope.groups.reverse();
  }
  function mkUnderlying(trades) {
    return mkGenericGroup(trades,  function(t) {
      return (t.underlyingSecurity ? t.underlyingSecurity.symbol : t.security.symbol);
    });
  }
  $rootScope.$on('loadedTrades', function() {
    $scope.groups = mkUnderlying($scope.$parent.filteredClosedTrades); 
    sortRows();
  });
}
function HomeCtrl($scope, User, Trades, $rootScope, $http, $filter) {
  setInterval(function() { $rootScope.$broadcast('refreshTrades');}, 45000);
  var lastRefresh = new Date();
  var nextRefresh = new Date();
  var minRefreshPeriod = 5000;
  function updateTrades(t) {
    lastRefresh = new Date();
    $scope.trades = t; 
    $scope.filterChanged();
  }
  Trades.get(updateTrades);
  $rootScope.$on('refreshTrades', function() {
    var curDate = new Date();
    if (nextRefresh > curDate) return;  // already have a "future" request queued
    if ((curDate - lastRefresh) < minRefreshPeriod) {
      nextRefresh = curDate + minRefreshPeriod;
      setTimeout(function(){ $rootScope.$broadcast('refreshTrades'); }, minRefreshPeriod);
      return;
    }
    User.get(function(u){$scope.user  = u ; });
    Trades.get(updateTrades); 
  });
  $scope.user = User.get(function(user) {
    if ((!user.roles) || user.roles.indexOf('basic') === -1) {
      $('#authCodeEntryModal').modal();
    }
  });
  var toggleReverseSort = true;
  var tradeSortFunction = null;
  $scope.isAdmin = function() {
    if ($scope.user && $scope.user.roles) 
      return $scope.user.roles.indexOf('admin') != -1;
    return false;
  }
  $scope.showTradeDetails = function(trade) {
    $scope.detailTrade = trade;
    $('#tradeDetailsModal').modal();
  };
  $scope.setTradeSortUnderlying = function() {
    toggleReverseSort = !toggleReverseSort;
    tradeSortFunction =  function(o){
      return  (o.underlyingSecurity ? o.underlyingSecurity.symbol : '');
    } ; 
    $scope.filterChanged();
  }
  $scope.setTradeSort = function(s) {
    // $scope.trades = _.sortBy($scope.trades, function(o){return o[s];});
    toggleReverseSort = !toggleReverseSort;
    tradeSortFunction = function(t) { return t[s]; }  ; 
    $scope.filterChanged();
  }
  $scope.refreshTrades = function(s) { $rootScope.$broadcast('refreshTrades'); }  ; 
  $scope.setTradeFilter = function(s) { $scope.tradeFilter = s; }  ; 
  $scope.curSymFilter = '';
  $scope.otherSymFilters = [];
  $scope.minDateFilter = null;
  $scope.maxDateFilter = null;
  $scope.filterChanged = function() {
    $scope.filteredTrades = [];
    function isSubstr(a,s) {
      if (a === null || s === null) return false;
      return a.toUpperCase().indexOf(s.toUpperCase()) != -1 ; 
    }
    // Here we are checking each trade if it matches our symbol
    // criteria.  Note that for symbols, the checking is additive or OR
    // based.  however, for things like the trade date, it will be AND-based
    // its a bit inelegant but I believe actually is a better match for
    // user expectations
    _.each($scope.trades, function(t) {
      var shouldInclude = false;
      if ($scope.curSymFilter != '' || $scope.otherSymFilters.length === 0) { 
        if (isSubstr(t.security.symbol, $scope.curSymFilter)) shouldInclude = true;
        if (isSubstr(t.underlyingSecurity.symbol, $scope.curSymFilter))
          shouldInclude = true;
      }
      _.each($scope.otherSymFilters, function (f) {
        if (isSubstr(t.symbol, f)) shouldInclude = true;
        if (isSubstr(t.underlyingSecurity.symbol, f)) shouldInclude = true;
      });
      // if we have a minDate and were before it, exclude the trade
      if ($scope.minDateFilter && (new Date(t.openDate) < $scope.minDateFilter) ) { 
        shouldInclude = false;
      } else if ($scope.maxDateFilter && new Date(t.openDate) > $scope.maxDateFilter) {
        shouldInclude = false;
      }
      if (shouldInclude) $scope.filteredTrades.push(t);
    });
    if (tradeSortFunction) {
      $scope.filteredTrades = _.sortBy($scope.filteredTrades, tradeSortFunction);
      if (toggleReverseSort) $scope.filteredTrades.reverse();
    }

    $scope.filteredClosedTrades = closedTrades($scope.filteredTrades);
      //$filter('filter')($scope.trades, $scope.tradeFilter);
    $rootScope.$broadcast('loadedTrades');

  };
  // set the min date for n days back
  $scope.setMinDate = function(n) {
    var diff = 1000 * 24 * 60 * 60 * n;
    $scope.minDateFilter  = new Date(new Date() - diff);
    console.log('setting date: ' + $scope.minDateFilter);  // _DEBUG
    $scope.filterChanged();
  } 
  $scope.addSymFilter = function(s) {
    if (s.trim().length === 0) return ; 
    var unq = true;
    _.each($scope.otherSymFilters, function(i) {
      if (i.toUpperCase() === s.toUpperCase()) { unq = false;  }
    });
    if (unq){ 
      $scope.otherSymFilters.push(s);
      $scope.filterChanged();
    }
  }
  $scope.clearTradeFilter = function () {
    $scope.curSymFilter = ''; 
    $scope.otherSymFilters = [];
    $scope.minDateFilter =  null;
    $scope.maxDateFilter =  null;
    $scope.filterChanged();
  } ;
}
