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

function HomeCtrl($scope, User, Trades, $rootScope) {
  $rootScope.$on('refreshTrades', function() {
    $scope.user = User.get();
    $scope.trades = Trades.get();

  });
  $scope.user = User.get();
  $scope.trades = Trades.get();
  $scope.tradeFilter = '';
  $scope.setTradeFilter = function(s) {
    $scope.tradeFilter = s; 
    $scope.$apply();
  } 
}
