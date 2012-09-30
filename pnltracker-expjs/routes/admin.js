var conf    = require('../config').genConf();
var Models = require('../models') ;

/*
 * GET home page.
 */

exports.usersList = function(req, res){
  var loggedIn = req.user;
  Models.User.find({}, function(err, a) {
    if (err) return res.send(400, err);
    return res.send(200, a);
  });
};

exports.uploadsList = function(req, res){
  var loggedIn = req.user;
  Models.Upload.find({}, function(err, a) {
    if (err) return res.send(400, err);
    return res.send(200, a);
  });
};

exports.mailsList = function(req, res){
  var loggedIn = req.user;
  Models.MailArchive.find({}, function(err, a) {
    if (err) return res.send(400, err);
    return res.send(200, a);
  });
};

exports.tradesList = function(req, res){
  var loggedIn = req.user;
  Models.Trade.find({})
              .populate('owner')
              .exec(function(err, a) {
    if (err) return res.send(400, err);
    return res.send(200, a);
  });
};
