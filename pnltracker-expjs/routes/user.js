var Models = require('../models') ; 
var Ib = require("../lib/parsers/ib.js");
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
  res.send(req.user);
};

exports.setDummyUser = function(req,res) {
  if (req.user && req.user._id) { res.redirect('/');}
  req.session.auth = { loggedIn: true, userId: '50565d101c41d90000000003'};
  res.redirect('/');
}
exports.loadDummyTrades = function(req,res) {
  if (!req.user || !req.user._id) { res.redirect('/auth/facebook');}
  Models.Trade.find({owner: req.user._id}).remove(function(err, prevTrade) {
    fs.readFile("../assets/ib_email_sample.html", "utf8", function(fsErr,data) {
      if (fsErr) res.send(500, fsErr);
      var fills = tradeFixtures.ibGeneratedSampleTrades;
      // var fills = Ib.parseEmailedReportString(data);
      Models.mkTradesAndSave(req.user._id, fills, function(err) {
        if (err) {res.send(500,'error: ' + err);}
        res.redirect('/');

      });
    });

  });

}; 
