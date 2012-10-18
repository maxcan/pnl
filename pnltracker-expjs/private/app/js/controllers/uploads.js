'use strict';

function FileUploadCtrl($scope, Trades, $rootScope)
{
  var uploader = new plupload.Uploader(
    { container: 'upload_container'
    , runtimes : 'html5,html4'
    , url : '../../api/report/upload'
    , max_file_size : '10mb'
    , browse_button: 'upload_select_btn_shim'
    , drop_element: 'drop_area'
  });
  uploader.init();

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
                $.post(postUrl, {pdfText: reportLines})
                 .error(function(data, status, headers, config) {
                   console.log('post error');  // _DEBUG
                   var err = (data.responseText 
                             ? data.responseText + '\nSupport has been notified'
                             : 'Unknown Error Occurred.  Please contact support');
                   alert(err);
                 })
                 .success(function(data) {
                   console.log('post success!');  // _DEBUG
                   if (data && data != 'OK') alert(data);
                   $rootScope.$broadcast('refreshTrades');
                  });
                // ok, send this to the server
              }
            });
          });
        } catch (e) { throw e; }
      };
      catPage(1);
    });
  };
  $scope.uploader = uploader;
  // $scope.uploader.init();
  $scope.files = [];
  $scope.uploader.bind('FilesAdded', function(up, files) {
    _.each(files, function(f) {$scope.files.unshift(f)});
    $scope.$apply();
    $scope.uploader.start();
  });

  $scope.uploader.bind('FileUploaded', function(up, files, res) {
    if (res && res.response) {
      try {
        var resObjs = JSON.parse(res.response);
        _.each(resObjs, function(obj) { 
          if (obj.pdfUrl && obj.setTextUrl) {
            
            handlePdfResponse(obj.pdfUrl, obj.setTextUrl) ;
          } else {
            console.log('no PDF url');  // _DEBUG
          }
        });
      } catch (e) {
        console.log('BAD JSON FROM SERVER: ' + e ); 
      }
    } else {
      console.log(' res is null' )  ;
    }
  }); 
}
// FileUploadCtrl.$inject = ['scope'];

