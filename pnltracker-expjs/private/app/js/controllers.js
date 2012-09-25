'use strict';

/* Controllers */

// old example controllers from angular
function FileUploadCtrl($scope)
{
  $scope.uploader = $('#upload_container').pluploadQueue({
  // $scope.uploader = new plupload.Uploader({
    runtimes : 'html5,html4',
    url : '../../api/report/upload', 
    max_file_size : '10mb',
    // container: 'uploadContainer',
    drop_element: 'drop_area'
  });

  $scope.uploader.init();

  // $scope.uploader.bind('FilesAdded', function(up, files) {
  //   $scope.$apply();
  // }); 
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
