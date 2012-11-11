var Models = require('../models') ;
var log = require('../log')
var async = require('async') ;
var BrokerReportManager = require('../lib/broker_report_manager.js');
var util = require('util');
var ModelsTrade = require('../models/trade') ;
var fs = require('fs') ;
var AppUtil = require("../appUtil.js");
var _ = require('underscore');

var  mkApiFill = function(fill) {
  var ret = {};
  var flds = ['_id', 'owner', 'qty', 'avgPx', 'fees','date'];
  _.each(flds, function(k) { ret[k] = fill[k];} );
  return ret;
} ;

var mkApiTrade = function (t) { 
  var ret = {};
  _.each( ['_id', 'owner','isOpen', 'openDate', 'duration' 
          , 'notes'
          , 'security', 'underlyingSecurity']
        , function(k) { ret[k] = t[k];} );
  ret.netCash = t.netCash;
  ret.netQty = t.netQty;
  ret.totalBuy = t.totalBuy;
  ret.totalSell = t.totalSell;
  ret.vwapSell = t.vwapSell;
  ret.vwapBuy = t.vwapBuy;
  ret.maxPrin = t.maxPrin;
  ret.closeDate = t.closeDate;
  ret.symbol = t.symbol.substring(3);
  ret.isLong = t.fills[0].qty > 0;
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
        if (trades[idx].security) {
          if (trades[idx].security.underlying) {
            Models.Security.findById(trades[idx].security.underlying, function (err, undlSecurity) {
              if (err) throw new Error('error subpopluating securities');
              if (!undlSecurity) throw new Error('missing underlying security');
              trades[idx].underlyingSecurity = undlSecurity;
              return populateUnderlying(null, idx + 1);
            });
          } else {
            // security, but no underlying, set to self
            trades[idx].underlyingSecurity = trades[idx].security;
            return populateUnderlying(null, idx + 1);

          }
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
  if (!req.user) {return res.send(403, "authentication required");}
  if (!req.params.uploadId) {return  res.send(400, "upload id required");}
  Models.BrokerReport.findOne({_id: req.params.uploadId}, function(err, upload) {
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
  Models.BrokerReport.findOne({_id: req.params.uploadId}, function(err, uploadedReport) {
    if (err) throw err;
    if (uploadedReport) {
      uploadedReport.extractedText = req.body.pdfText;
      uploadedReport.save(function(err, savedUpload) {
        return BrokerReportManager.processUpload(savedUpload, function(err) {
          if (err) {
            if (err === BrokerReportManager.DuplicateUpload) {
              console.log('Duplicate Report, not processing');
              return res.send(200, "This was a duplicate upload and will be ignored");
            }
            var errStr = 'Failed to save report: ' + err;
            console.log(errStr);
            return res.send(500, errStr);
          }
          return res.send(200);
        });
      });
    } else {
      res.send(404, "no such file");
    }
  });
  
}; 

exports.setNotes = function(req, res) {
  if (!req.user) {return res.send(403, "authentication required");}
  if (!req.params.tradeId) {return  res.send(403, 'tradeId required'); }
  return Models.Trade.findOne({owner: req.user._id, _id: req.params.tradeId}, setNote);
  function setNote(err, trade) {
    if (err) {
      log.error('Could fetch trade to set notes.  id: ' + req.params.tradeId + ' err: ' + err);
      return res.send(403, 'unknown system error');
    }
    if (!trade) return res.send(403, 'no such trade id');
    log.info('setting notes: ' + req.body.notes);
    trade.notes = req.body.notes;
    trade.save(function(err) {
      if (err) {
        log.error('Could not set notes for trade.  id: ' + req.params.tradeId + ' err: ' + err);
        return res.send(403, 'unknown system error');
      }
      return res.send(200);
    });
  }
}

exports.reportUpload = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  AppUtil.blockCache(res);
  if (req.body.reportText) {
    var uploadObj = { owner: req.user._id
                    , uploadMethod: 'uploadText'
                    , receivedDate: new Date()
                    , processed: false
                    , senderId: req.ip
                    , extractedText: req.body.reportText.split(/\n/)
                    }; 
    return Models.BrokerReport.create(uploadObj, function(err,report) {
      if (err) {
        log.info('error creating broker report for text: '+  err); 
        res.send(500, 'Could not save your trades');
      }
      BrokerReportManager.processUpload(report, function(err) {
        if (err) {
          log.error('Error processing file: ' + err + ' repid: ' + report._id);  
          return res.send(500,'could not process your file.  contact support');
        }
        return res.send(200, 'Uploaded');
      });
    });
  }
  if (!req.files) return res.send(401, "no files");
  var resObjs = [];
  return async.forEach([req.files.file], saveSingleFile, sendCombinedResp ) ; 
  // _.each(req.files, function(file) {
  function sendCombinedResp(err) {
    if (err) {
      log.error('ERROR in processing upload.. ');  
      return res.send(500, err);
    }
    return res.send(200, resObjs);
  }
  function saveSingleFile(file, asyncCallback) { 
    var content = fs.readFileSync(file.path) ;
    var uploadObj = { owner: req.user._id
                    , content: content
                    , uploadMethod: 'upload'
                    , mimeType: file.mime
                    , receivedDate: new Date()
                    , processed: false
                    , senderId: req.ip
                    , fileName: file.name
                    }
    Models.BrokerReport.create(uploadObj, function(err,report) {
      if (err) throw err;
      if (file.mime.length - file.mime.toLowerCase().indexOf('/pdf') != 4) {
        console.log(' rep is NOT pdf: ' + file.name);  // _DEBUG
        BrokerReportManager.processUpload(report, function(err) {
          if (err) {
            console.log('Error processing file: ' + e + ' repid: ' + report._id);  // _DEBUG
            return asyncCallback('could not process your file.  contact support');
            // return res.send(500,'could not process your file.  contact support');
          }
          return asyncCallback(null); // no further processing necessary
        });
      } else {
        // its a PDF.  we need to extract the text client side..
        resObjs.push({ pdfUrl: '/api/report/get/' + report._id
                     , setTextUrl:  '/api/report/setText/' + report._id });
        return asyncCallback(null);
      }
    });
  };
};
