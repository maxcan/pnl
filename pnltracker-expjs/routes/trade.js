var Models = require('../models') ;
var util = require('util') ;
var _ = require('underscore');

var  mkApiFill = function(fill) {
  var ret = {};
  var flds = ['_id', 'owner', 'avgPx', 'fees','date'];
  _.each(flds, function(k) { ret[k] = fill[k];} );
  return ret;
} ;
var mkApiTrade = function (t) { 
  var ret = {};
  console.log(ret);  // _DEBUG
  ret.netCash = t.netCash;
  ret.netQty = t.netQty;
  _.each(['_id', 'owner', 'symbol','isOpen'], function(k) { ret[k] = t[k];} );
  ret.fills  = _.map(t.fills, mkApiFill);
  return ret;
} ; 

exports.list = function(req, res){
  if (!req.user) {res.send(403, "authentication required");}
  Models.Trade.find({owner: req.user._id}, function(err, trades) {
    if (err) res.send(500, "Could not Fetch your trades");
    var apiTrades = _.map(trades, mkApiTrade);
    res.send(apiTrades);
  });
  
};

exports.show = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  res.send(req.user);
};
