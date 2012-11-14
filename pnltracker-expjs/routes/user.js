require("coffee-script") ; 
var log = require('../log')
var StripeUtil = require('../lib/stripeUtil');
var Models = require('../models') ; 
var conf    = require('../config.js').genConf();
var stripe  = require('stripe')(conf.stripeSecretKey);
var _ = require('underscore');
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
  var ret = {};
  _.each( ['_id', 'name','email', 'roles', 'accountStatus' 
          , 'reportDropboxAddr' ] 
        , function(k) { ret[k] = req.user[k];} );
  ret['stripePublishableKey'] = conf.stripePublishableKey ; 
  if (req.user.accountStatus === 'trial') {
    var now = new Date();
    diff = conf.trialPeriodDays -
           Math.round(((new Date()) - req.user.firstLogin) / ( 1000*60*60*24));
    ret['trialDaysRemaining'] = diff; 
  }
  ret['needsPayment'] = _.any([ req.user.accountStatus === null
                              , req.user.accountStatus === ''
                              , req.user.accountStatus === 'problem'
                              , req.user.accountStatus === 'needsPayment' ] );
  AppUtil.blockCache(res);
  return res.send(ret);
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

exports.getNote = function(req, res) {
  if (!req.user || !req.user._id) { return res.send(500, 'auth required');}
  return Models.Note.find({owner:req.user._id}, function(err, nt) {
    if (err) {
      log.error('erorr '  + err + ' loading note: ' + req.user._id + ' and note key: ' + req.body.key);
      return res.send(500, 'uknown error');
    }
    return res.send(200, nt);  
  });
}; 

exports.setNote = function(req, res) {
  if (!req.user || !req.user._id) { return res.send(500, 'auth required');}
  if (!req.body.key) { return res.send(400, 'key required');}
  return Models.Note.findOne({owner:req.user._id, key: req.body.key}, function(err, nt) {
    if (err) {
      log.error('erorr '  + err + ' loading note: ' + req.user._id + ' and note key: ' + req.body.key);
      return res.send(500, 'uknown error');
    }
    if (nt) {
      nt.text = req.body.text;
      nt.save(function(saveErr) {
        if (saveErr) {
          log.error('error ' + saveErr + '  saving note: ' + req.user._id + ' and note key: ' + req.body.key);
          return res.send(500, 'uknown error');
        }
        res.send(200);
      });
    } else {
      Models.Note.create({owner: req.user._id, key: req.body.key, text: req.body.text},function (createErr) {
        if (createErr) {
          log.error('error ' + createErr + '  saving note: ' + req.user._id + ' and note key: ' + req.body.key);
          return res.send(500, 'uknown error');
        }
        res.send(200);
      });
    }
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

exports.checkCoupon = function(req, res) {
  if (!req.user || !req.user._id) { return res.send(500, 'auth required');}
  if (!req.body.redemptionCode) { return res.send(500, 'stripe token required');}
  stripe.coupons.retrieve(req.body.redemptionCode, function(err, coupon) {
    if (err) return res.send(500, "Invalid Coupon");
    if (!coupon.percent_off) 
      return res.send(500, "Corrupt Redemption Code, email support@tradejitsu.com");
    return res.send(200, {'percent_off' : coupon.percent_off});
  });
  
}

exports.setStripeToken = function(req, res) {
  if (!req.user || !req.user._id) { return res.send(500, 'auth required');}
  if (!req.body.stripeToken) { return res.send(500, 'stripe token required');}
  req.user.stripeToken = req.body.stripeToken;
  return req.user.save(function(err) {
    if (err) {
      console.log('ERROR in save stripe token.  tell support! ' + err); 
      return res.send(500, 'Could not store your payment token');
    }
    return StripeUtil.createAndSubscribeCustomer(req.user, req.body.redemptionCode, subCb);
    function subCb(subErr, succ) {
      if (subErr) {
        log.error('Error in stripe subscription: ' + subErr);
        return res.send(500, subErr);
      }
      req.user.accountStatus = 'paid';
      return req.user.save(function(subSaveErr) {
        if (subSaveErr) {
          log.error('error saving user paid status: ' + subSaveErr);
          return res.send(500, 'Error saving paid status.  Please contact support@tradejitsu.com');
        }
        return res.send(200, 'subscribed');
      });
    }
  });
};
