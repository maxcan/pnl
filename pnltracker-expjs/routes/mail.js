var Models = require('../models') ;
var util = require('util');
var fs = require('fs') ;
var async = require('async') ;
var AppUtil = require("../appUtil.js");
var _ = require('underscore');

exports.list = function(req, res){
  if (!req.user) { return res.send(403, "authentication required");}
  if (req.user.roles.indexOf('basic') === -1) {
     return res.send(403, "user needs basic role");
  }
  AppUtil.blockCache(res);
  Models.MailArchive.find({owner: req.user._id})
              .populate('security')
              .exec(function(err, mails) {
    if (err) return res.send(500, "Could not Fetch your trades");
    async.forEach(mails, popTrades, sendMails);
    function popTrades(mail, cb) {
      Models.Trade.find({owner: req.user._id, mailRef: mail._id}, function(err, trdArr) {
        if (err) cb(err);
        mail.trades = trdArr;
        cb(null);
      });
    }
    function sendMails() {
      function mkApiMail(m) { 
        var ret = {};
        _.each( ['_id', 'owner','from', 'trades', 'receivedDate' ]
              , function(k) { ret[k] = m[k];} );
        return ret;
      }
      res.send(200, _.map(mails, mkApiMail)); 
    }
  });
};
