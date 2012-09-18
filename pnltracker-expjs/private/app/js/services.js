'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('pnlApp.services', ['ngResource']).
  factory('User', function ($resource) {
    return $resource('../../api/user', {}, { update: {method:'PUT'} });
  }).

  factory('Trades', function ($resource) {
    return $resource( '../../api/trades'
                    , {}, { get: {method: 'GET', isArray: true}});
  }).
  value('version', '0.1');
