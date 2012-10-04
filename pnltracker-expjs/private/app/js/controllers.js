'use strict';

/* Controllers */

// old example controllers from angular
function FileUploadCtrl($scope, Trades, $rootScope)
{
  var uploader = $('#upload_container').pluploadQueue({
    runtimes : 'html5,html4',
    url : '../../api/report/upload', 
    max_file_size : '10mb',
    // container: 'uploadContainer',
    drop_element: 'drop_area'
  });

  function handlePdfResponse(pdfUrl, postUrl) {

    PDFJS.disableWorker = true;
    var reportLines = [];
    PDFJS.getDocument(pdfUrl).then(function(pdf) {
      var totalPages = pdf.numPages;
      var catPage = function(curPage) {
        try { 
          pdf.getPage(curPage).then(function(page) {
            page.getTextContent().then(function(bidiResults) {
              for (var k in bidiResults.bidiTexts) {
                reportLines.push(bidiResults.bidiTexts[k].str);
              }
              if (curPage < totalPages) {
                catPage(curPage + 1);
              } else {
                $.post(postUrl, {pdfText: reportLines}, function() {
                  $rootScope.$broadcast('refreshTrades');
                  // $rootScope.$apply();
                });
                // ok, send this to the server
              }
            });
          });
        } catch (e) {
          // Probably means we overshot the number over available pages
          throw e;
        }
      };
      catPage(1);
    });
  };
  $scope.uploader = uploader.pluploadQueue();
  // $scope.uploader.init();
  $scope.uploader.bind('FileUploaded', function(up, files, res) {
    console.log('file uploaded: res: '+ JSON.stringify(res));  // _DEBUG
    if (res && res.response) {
      try {
        var obj = JSON.parse(res.response);
        if (obj.pdfUrl && obj.setTextUrl) {
          
          handlePdfResponse(obj.pdfUrl, obj.setTextUrl) ;
        } else {
          console.log('no PDF url');  // _DEBUG
        }
      } catch (e) {
        console.log('BAD JSON FROM SERVER: ' + e ); 
      }
    } else {
      console.log(' res is null' )  ;
    }
    // $scope.$apply();
  }); 

}
// FileUploadCtrl.$inject = ['scope'];

function TradeDtlCtrl($scope, User, Trades) {
  $scope.user = User.get();
  $scope.trades = Trades.get();
}

function AdminCtrl($scope, $location, User
                  , AdminUsers
                  , AdminUploads
                  , AdminMails
                  , AdminTrades) {
  User.get({}, function(u) {
    $scope.user =  u;
    if (_.indexOf(u.roles, 'admin') === -1) {
      console.log('unauthorized');  // _DEBUG
      $location.path( "/" );
    }

  });
  $scope.adminUsers     = AdminUsers.get();
  $scope.adminUploads   = AdminUploads.get();
  $scope.adminMails     = AdminMails.get();
  $scope.adminTrades    = AdminTrades.get();
  $scope._ = _;
  $scope.keys = function(k) {
    if (!k) return null;
    if (typeof(k) === 'object') return _.keys(k);
    if (typeof(k) === 'array') return _.range(k);
    return null;
  }
}

// utility functions
function closedTrades (trades) {
  return _.filter(trades, function(t){return !t.isOpen;});
}

function mkGenericGroup(trades, groupingFunction) {
  var groupedTrades = _.groupBy(closedTrades(trades), groupingFunction);
  var buckets = [];
  _.each(groupedTrades, function(group, bucket) { 
    var nc = _.reduce(group, function(s,t) {return s+t.netCash;},0);
    buckets.unshift({group:bucket, netCash:nc});
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
      if (t.duration < 60 * 1000) return "<1min";
      if (t.duration < 60 * 60 * 1000) return "1min<  <1hr";
      if (t.duration < 5 * 60 * 60 * 1000) return "1hr<  <5hr";
      if (t.duration < 24 * 60 * 60 * 1000) return "5hr<  <1day";
      return ">1day";
    });
  }
  function refreshTrades(trades) {$scope.groups = mkDuration(trades);}
  $rootScope.$on('refreshTrades', function() {Trades.get(refreshTrades);});
  Trades.get(refreshTrades);
}

function UndlGroupCtrl($scope, Trades, $rootScope) {
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
  function refreshTrades(trades) { $scope.groups = mkUnderlying(trades); }
  $rootScope.$on('refreshTrades', function() {Trades.get(refreshTrades);});
  Trades.get(refreshTrades);
}
function HomeCtrl($scope, User, Trades, $rootScope) {
  $rootScope.$on('refreshTrades', function() {
    $scope.user = User.get();
    $scope.trades = Trades.get();

  });
  $scope.user = User.get();
  $scope.trades = Trades.get();
  $scope.tradeFilter = '';
  var toggleAsc = true;
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
  $scope.setTradeFilter = function(s) {
    $scope.tradeFilter = s; 
    //$scope.$apply();
  } 
}
