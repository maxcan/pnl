var _ = require('underscore');

exports.sum = function(arr) { return _.reduce(arr,function(a,b) { return a + b}, 0); }

