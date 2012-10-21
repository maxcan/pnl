'use strict';

// utility functions
function closedTrades (trades) {
  return _.filter(trades, function(t){return !t.isOpen;});
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
  var toggleAsc = true;
  $scope.setSort = function(col) {
    $scope.groups = _.sortBy($scope.groups, col);
    if (toggleAsc) $scope.groups.reverse();
    toggleAsc = !toggleAsc;
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
  });
}

function UndlGroupCtrl($scope, $rootScope) {
  var toggleAsc  = true;
  $scope.setSort = function(col) {
    $scope.groups = _.sortBy($scope.groups, col);
    if (toggleAsc) $scope.groups.reverse();
    toggleAsc = !toggleAsc;
  }
  function mkUnderlying(trades) {
    return mkGenericGroup(trades,  function(t) {
      return (t.underlyingSecurity ? t.underlyingSecurity.symbol : t.security.symbol);
    });
  }
  $rootScope.$on('loadedTrades', function() {
    $scope.groups = mkUnderlying($scope.$parent.filteredClosedTrades); 
  });
}
function HomeCtrl($scope, User, Trades, $rootScope, $http, $filter) {
  setInterval(function() { $rootScope.$broadcast('refreshTrades');}, 45000);
  var lastRefresh = new Date();
  var nextRefresh = new Date();
  var minRefreshPeriod = 5000;
  $rootScope.$on('refreshTrades', function() {
    var curDate = new Date();
    console.log('next refresh: ' + nextRefresh);  // _DEBUG
    console.log('last refresh: ' + lastRefresh);  // _DEBUG
    console.log('curRef req:   ' + curDate);  // _DEBUG
    if (nextRefresh > curDate) return;  // already have a "future" request queued
    if ((curDate - lastRefresh) < minRefreshPeriod) {
      nextRefresh = curDate + minRefreshPeriod;
      setTimeout(function(){ $rootScope.$broadcast('refreshTrades'); }, minRefreshPeriod);
      return;
    }
    User.get(function(u){$scope.user  = u ; });
    Trades.get(function(t) {
      lastRefresh = curDate;
      $scope.trades = t; 
      $scope.filteredClosedTrades = $filter('filter')($scope.trades, $scope.tradeFilter);
      $rootScope.$broadcast('loadedTrades');
      } ) ; 
  });
  $scope.user = User.get(function(user) {
    if ((!user.roles) || user.roles.indexOf('basic') === -1) {
      $('#authCodeEntryModal').modal();
    }
  });
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
  $scope.trades = Trades.get(function(t) {
    $scope.trades = t; 
    $scope.filteredClosedTrades = $filter('filter')($scope.trades, $scope.tradeFilter);
    $rootScope.$broadcast('loadedTrades');
  });
  $scope.filterChanged = function() {
    $scope.filteredClosedTrades = $filter('filter')($scope.trades, $scope.tradeFilter);
    $rootScope.$broadcast('loadedTrades');
  };
  $scope.tradeFilter = '';
  $scope.clearTradeFilter = function () {
    $scope.tradeFilter = ''; 
    $rootScope.$broadcast('loadedTrades');
  } ;
  var toggleAsc = true;
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
    $scope.trades = _.sortBy($scope.trades, function(o){
      if (o.underlyingSecurity) return o.underlyingSecurity.symbol;
      return '';
    });
    if (toggleAsc) $scope.trades.reverse();
    toggleAsc = !toggleAsc;
  }
  $scope.setTradeSort = function(s) {
    $scope.trades = _.sortBy($scope.trades, function(o){return o[s];});
    if (toggleAsc) $scope.trades.reverse();
    toggleAsc = !toggleAsc;
  }
  $scope.refreshTrades = function(s) { $rootScope.$broadcast('refreshTrades'); }  ; 
  $scope.setTradeFilter = function(s) { $scope.tradeFilter = s; }  ; 
}
