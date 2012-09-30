'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var pnlApp = angular.module('pnlApp.services', ['ngResource']);

pnlApp.factory('User', function ($resource) {
    return $resource('../../api/user', {}, { update: {method:'PUT'} });
  });

pnlApp.factory('Trades', function ($resource) {
    return $resource( '../../api/trades'
                    , {}, { get: {method: 'GET', isArray: true}});
  });

pnlApp.value('version', '0.1');

//  Admin services
pnlApp.factory('AdminUsers', function ($resource) { return $resource('../../api/admin/users', {} , { get: {method: 'GET', isArray: true}}); });
pnlApp.factory('AdminTrades', function ($resource) { return $resource('../../api/admin/trades', {} , { get: {method: 'GET', isArray: true}}); });
pnlApp.factory('AdminUploads', function ($resource) { return $resource('../../api/admin/uploads', {} , { get: {method: 'GET', isArray: true}}); });
pnlApp.factory('AdminMails', function ($resource) { return $resource('../../api/admin/mails', {} , { get: {method: 'GET', isArray: true}}); });

