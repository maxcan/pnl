var _ = require('underscore');
var util = require('util');
var TradeStation = require("../lib/parsers/ts.js");
var Models = require("../models.js");
var ModelsTrade = require("../models/trade");
var async = require('async') ;
var Ib = require("../lib/parsers/ib.js");

exports.DuplicateUpload = 'Duplicate Upload';
exports.processUpload = function (report, callback) {
  Models.BrokerReport.findOne( { md5Hash:report.md5Hash
                               , processed: true }
                             , function(err, dupedReport) {
    console.log('processupload cehck report cb');
    if (dupedReport) {
      console.log('DUPED report');  // _DEBUG
      return callback(exports.DuplicateUpload);
    }
    return processUploadDupeChecked(report, callback);
  });
}
function processUploadDupeChecked(report, callback) {
  console.log('processing report: ');  // _DEBUG
  if (report.uploadMethod === 'email') {
    console.log('processing email');  // _DEBUG
    if (report.mailObj) return processEmailUpload(report, processTradesCB);
    if (report.mailRef) {
      console.log('Need to populate the original mail object');  // _DEBUG
      return Models.MailArchive.findById(report.mailRef, function(e,ma) {
        if (e) return callback(e);
        if (!ma)
          return callback('could not load mail record for upload');
        report.mailObj = ma;
        return processEmailUpload(report, processTradesCB);
      });
    }
  } else if (report.uploadMethod === 'upload') {
    return processUploadedTsReport(report, processTradesCB)
  } else { return callback('unsupported report type'); }
  function processTradesCB(err, trades) {
    if (err) {
      return callback(err);
    }
    console.log(' about ot save the trades');  // _DEBUG
    ModelsTrade.mkTradesAndSave(report.owner, trades, function(err) {
      if (err) {
        console.log('Error on mktrades and save: ' + err);  
        return callback(err);
      }
      report.processed = true;
      report.save(function(err) {
        if (err) {
          console.log('Error on mktrades and save: ' + err);  
          return callback(err);
        }
        callback();
      });
    });
  }
}
function processUploadedTsReport(uploadedReport, callback) {
  console.log('About to process report: ' + uploadedReport._id);  // _DEBUG
  console.log('            filename   : ' + uploadedReport.fileName);  // _DEBUG
  var trades = TradeStation.parseTradeStationExtractedText(uploadedReport.extractedText);
  _.each(trades, function(t){
    _.extend(t,{owner: uploadedReport.owner, reportRef: uploadedReport._id})
  });
  return callback(null, trades);
}
function processEmailUpload(report, callback) {
  console.log('processEmailUpload loading');  // _DEBUG
  var mailMsg = report.mailObj;
  if (mailMsg.subject.indexOf('Interactive Brokers Daily Trade Report') != -1) {
    Models.User.findOne({reportDropboxAddr : { $in: mailMsg.to}},function(err,usr) {
      if (err) return callback(err);
      if (!usr) return callback('Could not get user for db address: ' + mailMsg.to);
      console.log('found owner');  // _DEBUG
      if ((report.processed === false) &&
          (report.fileName.indexOf('DailyTradeReport') != -1)) {
        var trades = 
              Ib.parseEmailedReportString(report.content, usr._id, mailMsg._id, report._id);
        console.log('found trades: ' + util.inspect(trades));  // _DEBUG
        report.owner = usr._id;
        return report.save(function() { return callback(null, trades);}); 
      }
    });
  } else {
    console.log('unexpected sujbect: ' + mailMsg.subject);  // _DEBUG
    return callback('mismatched subject: ' + mailMsg.subject);
  }
} 
