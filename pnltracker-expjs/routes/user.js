var Models = require('../models') ; 
var conf    = require('../config.js').genConf();
var util = require('util');
var ModelsTrade = require('../models/trade') ; 
var Ib = require("../lib/parsers/ib.js");
var AppUtil = require("../appUtil.js");
var fs = require('fs');

var tradeFixtures = require('../test/fixtures/parse_trade_output.js');

/*
 * GET users listing.
 */

exports.list = function(req, res){
  return res.send("respond with a resource");
};

exports.show = function(req, res) {
  if (!req.user) {return res.send(403, "authentication required");}
  AppUtil.blockCache(res);
  return res.send(req.user);
};

exports.setDummyUser = function(req,res) {
  if (req.user && req.user._id) { return res.redirect('/');}
  Models.User.findOne({email: 'i@cantor.mx'}, function(err, usr) {
    if (err) throw err;
    req.session.auth = { loggedIn: true, userId: usr._id};
    return res.redirect('/');
  });
}
exports.loadDummyTrades = function(req,res) {
  if (!req.user || !req.user._id) { return res.redirect('/auth/facebook');}
  Models.Trade.find({owner: req.user._id}).remove(function(err, prevTrade) {
    var fills = tradeFixtures.sampleTradeSet;
    ModelsTrade.mkTradesAndSave(req.user._id, fills, function(err) {
      if (err) {return res.send(500,'error: ' + err);}
      return res.redirect('/');
    });
  });
}; 

exports.setAuthCode = function(req, res) {
  if (!req.user || !req.user._id) { return res.redirect('/auth/facebook');}
  if (!req.body.authcode) { return res.send(500, 'authcode required');}
  if (conf.ignoreAuthCode) {
    if (!req.user.roles) { req.user.roles = [] ; } 
    req.user.roles.unshift('basic');
    console.log('IGNORING AUTH CODE FOR DEV');  // _DEBUG
    return req.user.save(function(err) {
      if (err) {
        console.log('ERROR in set auth code.  tell support! ' + err); 
        return res.send(500, 'couldnt save');
      }
      return res.send(200);
    });
  }
  Models.AuthCode.findOne({value: req.body.authcode}, function(err, ac) {
    if (err) return res.send(500, 'mongo error: ' + err);
    if (req.user.roles.indexOf(ac.roleGiven) != -1) {
      return res.send(500, 'user already has that role');
    }
    req.user.roles.unshift(ac.roleGiven);
    req.user.save(function(err) {
      if (err) {
        console.log('ERROR in set auth code.  tell support! ' + err); 
        return res.send(500, 'couldnt save');
      }
      Models.AuthCode.findByIdAndRemove(ac._id, function() {
        return res.send(200, 'role assigned');

      });

    }) ; 
  });
};
