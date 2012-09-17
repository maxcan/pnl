var Models = require('./models') ;
var _ = require('underscore');

exports.list = function(req, res){
  if (!req.user) {res.send(403, "authentication required");}
  Models.Trade.find({owner: req.user._id}, function(err, trades) {
    
  });
  
};

exports.show = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  res.send(req.user);
};
