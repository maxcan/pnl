'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('pnlApp.services', ['ngResource']).
  factory('User', function ($resource) {
    return $resource('../../api/user', {}, { update: {method:'PUT'} });
  }).value('version', '0.1');
