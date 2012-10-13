var conf    = require('../config').genConf();
var async = require('async') ;
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

exports.cleanDb = function(req, res) {
  Models.Security.find({}, function(err, securities){ 
    if (err) return res.send(500, err);
    return async.forEach(securities, saveSec, processUploads);
    function saveSec(sec, asyncCb) { sec.save(asyncCb); };
  });
  function processUploads() {
    Models.BrokerReport.find({}, function(err, reports) {
      if (err) return res.send(500, err);
      return async.forEach(reports, saveRep, succ);
      function saveRep(rep, asyncCb) { rep.save(asyncCb); };
    });
  }
  function succ() { return res.send(200); }
};
