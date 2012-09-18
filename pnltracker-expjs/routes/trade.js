var Models = require('../models') ;
var _ = require('underscore');

function mkApiTrade(t) { return t; } 

exports.list = function(req, res){
  if (!req.user) {res.send(403, "authentication required");}
  Models.Trade.find({owner: req.user._id}, function(err, trades) {
    if (err) res.send(500, "Could not Fetch your trades");
    res.send(_.map(trades, mkApiTrade));
  });
  
};

exports.show = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  res.send(req.user);
};
