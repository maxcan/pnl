'use strict';

function AdminCtrl($scope, $location, $http, User
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
  $scope.cleanDb = function () {
    $http.post('../../api/admin/clean-db').success(function(d) {
      alert('cleaned!');
      console.log('successfully generated code: ' + d);
    });
  };
  $scope.loadDummyTrades = function() {
    $http.get('../../test/admin/users/ld').success(function(d) {
      alert('loaded');
    }).error(function(e) {
      alert('failed to load: ' + e);
    });
  };
  $scope.getAuthCode    = function() {
    $http.post('../../api/admin/authcode').success(function(d) {
      alert('successfully generated code: ' + d);
      console.log('successfully generated code: ' + d);
      $http.get('../../api/admin/authcodes').success(function(a) { $scope.authCodes = a;  });
    });
  };
  $http.get('../../api/admin/authcodes').success(function(a) { $scope.authCodes = a;  });
  $scope.mkValueModel   = function(o) { return {tableValues:o};};
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


