var Models = require('../models') ;
var Util = require('util') ;
var fs = require('fs') ;
var util = require("../util.js");
var _ = require('underscore');

var  mkApiFill = function(fill) {
  var ret = {};
  var flds = ['_id', 'owner', 'qty', 'avgPx', 'fees','date'];
  _.each(flds, function(k) { ret[k] = fill[k];} );
  return ret;
} ;

var mkApiTrade = function (t) { 
  var ret = {};
  console.log(ret);  // _DEBUG
  ret.netCash = t.netCash;
  ret.totalBuy = t.totalBuy;
  ret.totalSell = t.totalSell;
  _.each(['_id', 'owner', 'symbol','isOpen', 'openDate', 'duration'], function(k) { ret[k] = t[k];} );
  ret.fills  = _.map(t.fills, mkApiFill);
  return ret;
} ; 

exports.list = function(req, res){
  if (!req.user) {res.send(403, "authentication required");}
  util.blockCache(res);
  Models.Trade.find({owner: req.user._id}, function(err, trades) {
    if (err) res.send(500, "Could not Fetch your trades");
    var apiTrades = _.map(trades, mkApiTrade);
    res.send(apiTrades);
  });
  
};

exports.show = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  util.blockCache(res);
  res.send(req.user);
};

exports.reportUpload = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  util.blockCache(res);
  if (req.files) {
    _.each(req.files, function(file) {
      console.log('found file.  keys = ' + _.keys(file));  // _DEBUG
      var content = fs.readFileSync(file.path) ;
      var uploadObj = { owner: req.user._id
                      , content: content
                      , mimeType: file.mime
                      }
      console.log(' about to create the opbject');  // _DEBUG
      Models.Upload.create(uploadObj, function(err,upload) {
        console.log(' created at path: ' + file.path);  // _DEBUG
        if (err) throw err;
        if (file.path.length - file.path.toLowerCase().indexOf('.pdf') != 4) {
          return res.send(200);
        } else {
          console.log(' added pd with objectid : ' + upload._id);  // _DEBUG
          return res.send(200, {pdfUrl: '/api/report/get/' + upload._id});
        }
      });
    });
  } else {
    return res.send(401, "no files");
  }
};
