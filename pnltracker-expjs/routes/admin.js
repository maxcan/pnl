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

exports.genAuthCode = function(req, res){
  var val = Models.randomString(8);
  Models.AuthCode.create({value: val, roleGiven: 'basic'}, function(err) {
    if (err) return res.send(400, err);
    return res.send(200, val);
  });
};

exports.authCodesList = function(req, res){
  var loggedIn = req.user;
  Models.AuthCode.find({}, function(err, a) {
    if (err) return res.send(400, err);
    return res.send(200, a);
  });
};

exports.uploadsList = function(req, res){
  var loggedIn = req.user;
  Models.BrokerReport.find({}, function(err, a) {
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
