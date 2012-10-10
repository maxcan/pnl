var Models = require('../models') ;
var util = require('util');
var ModelsTrade = require('../models/trade') ;
var fs = require('fs') ;
var AppUtil = require("../appUtil.js");
var TradeStation = require("../lib/parsers/ts.js");
var _ = require('underscore');

var  mkApiFill = function(fill) {
  var ret = {};
  var flds = ['_id', 'owner', 'qty', 'avgPx', 'fees','date'];
  _.each(flds, function(k) { ret[k] = fill[k];} );
  return ret;
} ;

var mkApiTrade = function (t) { 
  var ret = {};
  _.each( ['_id', 'owner','isOpen', 'openDate', 'duration' , 'security', 'underlyingSecurity']
        , function(k) { ret[k] = t[k];} );
  ret.netCash = t.netCash;
  ret.totalBuy = t.totalBuy;
  ret.totalSell = t.totalSell;
  ret.vwapSell = t.vwapSell;
  ret.vwapBuy = t.vwapBuy;
  ret.symbol = t.symbol.substring(3);
  ret.fills  = _.map(t.fills, mkApiFill);
  if (t.security) ret.securityDesc = t.security.desc;
  return ret;
} ; 

exports.list = function(req, res){
  if (!req.user) { return res.send(403, "authentication required");}
  if (req.user.roles.indexOf('basic') === -1) {
     return res.send(403, "user needs basic role");
  }
  AppUtil.blockCache(res);
  Models.Trade.find({owner: req.user._id})
              .populate('security')
              .exec(function(err, trades) {
    if (err) return res.send(500, "Could not Fetch your trades");
    populateUnderlying(null, 0);
    function populateUnderlying(err, idx) {
      if (idx >= trades.length) {
        // now we 'escape'
        var apiTrades = _.map(trades, mkApiTrade);
        return res.send(apiTrades);
      } else {
        if (err) throw new Error('error subpopluating securities');
        if (trades[idx].security && trades[idx].security.underlying) {
          Models.Security.findById(trades[idx].security.underlying, function (err, undlSecurity) {
            if (err) throw new Error('error subpopluating securities');
            if (!undlSecurity) throw new Error('missing underlying security');
            trades[idx].underlyingSecurity = undlSecurity;
            return populateUnderlying(null, idx + 1);
          });
        } else {
          return populateUnderlying(null, idx + 1);
        }
      }
    };
  });
};

exports.show = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  AppUtil.blockCache(res);
  res.send(req.user);
};

exports.getUpload = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  if (!req.params.uploadId) { res.send(400, "upload id required");}
  Models.Upload.findOne({_id: req.params.uploadId}, function(err, upload) {
    if (err) throw err;
    if (upload) {
      res.send(200, upload.content)
    } else {
      res.send(404, "no such file");
    }

  });
  
}
exports.setReportText = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  Models.Upload.findOne({_id: req.params.uploadId}, function(err, upload) {
    if (err) throw err;
    if (upload) {
      upload.extractedText = req.body.pdfText;
      upload.save(function(err, savedUpload) {
        if (err) throw err;
        var trades = TradeStation.parseTradeStationExtractedText(upload.extractedText);
        _.each(trades, function(t){_.extend(t,{owner: req.user._id})});
        ModelsTrade.mkTradesAndSave(req.user._id, trades, function(err) {
          if (err) {throw err; }
          res.send(200, upload.content)
        });
      });
    } else {
      res.send(404, "no such file");
    }
  });
  
}; 

exports.reportUpload = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  AppUtil.blockCache(res);
  if (req.files) {
    _.each(req.files, function(file) {
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
          return res.send(200,  { pdfUrl: '/api/report/get/' + upload._id
                                , setTextUrl:  '/api/report/setText/' + upload._id
                                });
        }
      });
    });
  } else {
    return res.send(401, "no files");
  }
};
