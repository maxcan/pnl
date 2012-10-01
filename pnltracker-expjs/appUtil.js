var _ = require('underscore');

exports.sum = function(arr) { return _.reduce(arr,function(a,b) { return a + b}, 0); }

exports.blockCache = function (res) {
  res.set( "Pragma", "no-cache" );
  res.set( "Cache-Control", "no-cache" );
  res.set( "Expires", new Date('2000-01-01' ));

}
