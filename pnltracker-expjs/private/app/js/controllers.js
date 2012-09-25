'use strict';

/* Controllers */

// old example controllers from angular
function FileUploadCtrl($scope)
{
  var uploader = $('#upload_container').pluploadQueue({
    runtimes : 'html5,html4',
    url : '../../api/report/upload', 
    max_file_size : '10mb',
    // container: 'uploadContainer',
    drop_element: 'drop_area'
  });

  $scope.uploader = uploader.pluploadQueue();
  // $scope.uploader.init();
  $scope.uploader.bind('FileUploaded', function(up, files, res) {
    if (res) console.log(' res: ' + JSON.stringify(res));  // _DEBUG
    if (!res) console.log(' res is null' )  ;
    // $scope.$apply();
  }); 

}
// FileUploadCtrl.$inject = ['scope'];

function TradeDtlCtrl($scope, User, Trades) {
  $scope.user = User.get();
  $scope.trades = Trades.get();
}

function HomeCtrl($scope, User, Trades) {
  $scope.user = User.get();
  $scope.trades = Trades.get();
}
