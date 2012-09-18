var Models = require('../models') ; 
var Ib = require("../lib/parsers/ib.js");
var fs = require('fs');

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

exports.loadDummyTrades = function(req,res) {
  if (!req.user || !req.user._id) { res.redirect('/auth/facebook');}
  fs.readFile("../assets/ib_email_sample.html", "utf8", function(fsErr,data) {
    if (fsErr) res.send(500, fsErr);
    var fills = Ib.parseEmailedReportString(data);
    Models.mkTradesAndSave(req.user._id, fills, function(err) {
      if (err) {res.send(500,'error: ' + err);}
      res.redirect('/');

    });
  });

}; 
