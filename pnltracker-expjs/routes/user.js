var Models = require('../models') ; 
var ModelsTrade = require('../models/trade') ; 
var Ib = require("../lib/parsers/ib.js");
var AppUtil = require("../appUtil.js");
var fs = require('fs');

var tradeFixtures = require('../test/fixtures/parse_trade_output.js');

/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.show = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  AppUtil.blockCache(res);
  res.send(req.user);
};

exports.setDummyUser = function(req,res) {
  if (req.user && req.user._id) { res.redirect('/');}
  Models.User.findOne({email: 'i@cantor.mx'}, function(err, usr) {
    if (err) throw err;
    req.session.auth = { loggedIn: true, userId: usr._id};
    res.redirect('/');
  });
}
exports.loadDummyTrades = function(req,res) {
  if (!req.user || !req.user._id) { res.redirect('/auth/facebook');}
  Models.Trade.find({owner: req.user._id}).remove(function(err, prevTrade) {
    fs.readFile("../assets/ib_email_sample.html", "utf8", function(fsErr,data) {
      if (fsErr) res.send(500, fsErr);
      var fills = tradeFixtures.ibGeneratedSampleTrades;
      // var fills = Ib.parseEmailedReportString(data);
      ModelsTrade.mkTradesAndSave(req.user._id, fills, function(err) {
        if (err) {return res.send(500,'error: ' + err);}
        return res.redirect('/');

      });
    });

  });

}; 
