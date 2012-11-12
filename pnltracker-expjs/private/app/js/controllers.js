'use strict';

// utility functions
function closedTrades (trades) {
  return _.filter(trades, function(t){return !t.isOpen;});
}

function UploadCtrl($rootScope, $scope, $http) {
  $scope.runReportTextModal = function() {
    $('#report_text_paste_modal').modal();
    $('#report_text_textarea').focus();
  }
  $scope.saveTradeData = function() {
    console.log(' save trade data');  // _DEBUG
    $http.post('../../api/report/upload', {reportText: $scope.reportText})
         .success(function() {
           $rootScope.$broadcast('refreshTrades');
           $('#report_text_paste_modal').modal('hide');
           $('#report_text_textarea').val('');
         })
         .error(function(data, status, headers,config) {
          console.log('error rdata:' + data);  // _DEBUG
          console.log('error rstatus:' + status);  // _DEBUG
           $('#report_text_paste_modal').modal('hide');
         });

  }
  
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

function mkTradeSummary(tradeArrRaw) {
  var wins = 0;
  var tradeArr = closedTrades(tradeArrRaw); 
  _.each(tradeArr, function(s,t) {if (t.netCash > 0) wins++;});
  return { trades: tradeArr
         , losses: tradeArr.length - wins
         , wins: wins
         , netCash: _.reduce(tradeArr, function(s,t) {return s + t.netCash;}, 0)
         } ; 
}

function JournalCtrl($scope, $http, Trades, $rootScope, $filter) {
  $scope.toDtStr = function (dt)  { return $filter('date')(dt, 'yyyyMMdd');}
  function toDtStrLong(dt)  { return $filter('date')(dt, 'mediumDate');}
  $scope.tradesByDay = {};  // [ { str: <human readable date>,  trades: [trades] } ] 
  $scope.toTop = function() { window.scrollTo(0,0); } 
  $scope.changeDay = function(dt) {
    var ele = '#' + (dt ? dt : $scope.daySelect);
    var c = $(ele).position();
    if (c) {window.scrollTo(0, c.top - 60);}
    return false;

  }; 
  $scope.notes = {};
  $scope.dirty = {};
  $scope.clean = {};
  $scope.setDirty = function(dt) { $scope.clean[dt] = false; $scope.dirty[dt] = true; }
  $scope.saveNote = function(dt) {
    var noteText = $('#' + dt + '_note').val();
    console.log('saving: ' +  noteText);  // _DEBUG
    $http.post('../../api/user/note', {key: dt, text: noteText})
         .success(function() { $scope.clean[dt] = true; $scope.dirty[dt] = false; })
         .error(function(e) { alert('error: ' + e);})
         ;
  }
  $http.get('../../api/user/notes').success(function(data) {
    var notes = {};
    _.each(data, function(singleNote) { notes[singleNote.key] = singleNote.text;});
    $scope.notes = notes;
  });
  Trades.get(function(t) {
    var tradesByDay = {};  // [ { str: <human readable date>,  trades: [trades] } ] 
    $scope.trades = closedTrades(t) ; 
    _.each($scope.trades, function(t) {
      var dt = $scope.toDtStr(t.openDate);
      if (!tradesByDay[dt]) tradesByDay[dt] = {str: toDtStrLong(t.openDate), trades:[]};
      tradesByDay[dt].trades.push(t);
    });
    _.each(tradesByDay, function(tbdObj, tbdDayStr) {
      tbdObj.summary = mkTradeSummary(tbdObj.trades);
    });
    $scope.bestDay  = _.max(tradesByDay, function (tbd) { return tbd.summary.netCash ; });
    $scope.worstDay = _.min(tradesByDay, function (tbd) { return tbd.summary.netCash ; });
    $scope.tradesByDay = tradesByDay;
    $scope.days = _.keys($scope.tradesByDay);
    $scope.days.sort();
    $scope.days.reverse();
  });
}

function CompareCtrl($scope, $location, Trades, $rootScope) {
  $scope.left = {filter: {groupName: 'Group One'}} ; 
  $scope.right = {filter: {groupName: 'Group Two'}}; 
  Trades.get(function(t) {
    $scope.trades = t;
    chkFilter($scope.left);
    chkFilter($scope.right);
  });
  function toStr(o) { 
    console.log('toStr o: ' + o.groupName);
    return angular.toJson(o);}
  $scope.checkAllFilters = function() {
    chkFilter($scope.left);
    chkFilter($scope.right);
  }; 
  function chkFilter(curFilterGroup) {
    var flt = curFilterGroup.filter;
    var st = (flt.startDate ? new Date(flt.startDate) : null);
    var end = (flt.endDate ? new Date(flt.endDate) : null);
    var curTrades = _.filter($scope.trades, function(t) {
      var td = new Date(t.openDate);
      if (st && (td < st)) return false;
      if (end && (td > end)) return false;
      if (flt.duration === 'intraday' && t.duration > (24*60*60*1000)) return false;
      if (flt.duration === 'interday' && t.duration < (24*60*60*1000)) return false;
      if (flt.side === 'long' && !t.isLong) return false;
      if (flt.side === 'short' && t.isLong) return false;
      return true;
    });
    curFilterGroup.data = mkTradeSummary(curTrades);
  }
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
function NavCtrl($scope, User, $rootScope, $location) {
  $scope.$location = $location;
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
    User.get(function(u){
      $scope.user  = u ;
      if (!$scope.user.accountStatus || $scope.user.accountStatus !== 'paid') {
        $scope.needPayment();
      }
    });
    Trades.get(updateTrades); 
  });
  $scope.needPayment = function() {
    setTimeout(function() {$rootScope.$broadcast('needPayment');},1) ; 
  }
  $scope.user = User.get(function(user) {
    $scope.user = user;
    console.log('checking user');  // _DEBUG
    if (!$scope.user.accountStatus || $scope.user.accountStatus !== 'paid') {
        $scope.needPayment();
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
    $('#tradeDetailsModal').unbind('hide');
    $('#tradeDetailsModal').on('hide', function() {
      $http.post('../../api/report/setNotes/' + trade._id, {notes: trade.notes})
           .error(function(e) { alert(e);})
           .success(function() { console.log('saved trade notes');  });
    })
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
