var conf    = require('../config').genConf();
var util    = require('util');
var async = require('async') ;
var Models = require('../models') ;

/*
 * GET home page.
 */

exports.getReport = function(req,res) {
  if (!req.params.reportId) { return res.send(500, "reportId required");}
  Models.BrokerReport.findById(req.params.reportId, function(err, rep) {
    if (err) throw err;
    if (req.xhr) { return res.send(200, rep); } 
    return res.send(200,'<html><body><pre>' + util.inspect(rep) + '</pre></body></html>');
  });
}; 

exports.setUser = function(req,res) {
  if (!req.params.userId) { return res.send(500, "user id required");}
  Models.User.findById(req.params.userId, function(err, usr) {
    if (err) throw err;
    req.session.auth = { loggedIn: true, userId: usr._id};
    return res.redirect('/');
  });
};

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
