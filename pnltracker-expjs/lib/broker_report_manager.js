var _ = require('underscore');
var log = require('../log.js')
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
    if (dupedReport) {
      log.info('DUPED report.  ids = ' + report._id + ' and ' + dupedReport._id);
      return callback(exports.DuplicateUpload);
    }
    return processUploadDupeChecked(report, callback);
  });
}
function processUploadDupeChecked(report, callback) {
  if (report.uploadMethod === 'email') {
    if (report.mailObj) return processEmailUpload(report, processTradesCB);
    if (report.mailRef) {
      return Models.MailArchive.findById(report.mailRef, function(e,ma) {
        if (e) return callback(e);
        if (!ma)
          return callback('could not load mail record for upload');
        report.mailObj = ma;
        return processEmailUpload(report, processTradesCB);
      });
    }
  } else if (report.uploadMethod === 'uploadText') {
    return processUploadedTextReport(report, processTradesCB)
  } else if (report.uploadMethod === 'upload') {
    return processUploadedTsReport(report, processTradesCB)
  } else { return callback('unsupported report type'); }
  function processTradesCB(err, trades) {
    if (err) {
      return callback(err);
    }
    ModelsTrade.mkTradesAndSave(report.owner, trades, function(err) {
      if (err) {
        log.info('Error on mktrades and save: ' + err);  
        return callback(err);
      }
      report.processed = true;
      report.save(function(err) {
        if (err) {
          log.info('Error on mktrades and save: ' + err);  
          return callback(err);
        }
        callback();
      });
    });
  }
}

function processUploadedTextReport(uploadedReport, callback) {
  log.info('About to process report: ' + uploadedReport._id);  
  log.info('            filename   : ' + uploadedReport.fileName);  
  try { 
    var trades = TradeStation.parseTradeStationCopiedText(uploadedReport.extractedText);
    _.each(trades, function(t){
      _.extend(t,{owner: uploadedReport.owner, reportRef: uploadedReport._id})
    });
    return callback(null, trades);
  } catch (e) {
    log.info(' error proceesing rep: ' + uploadedReport._id);  
    log.info(' error:  ' + e.stack);
    return callback('failed on ' + uploadedReport.fileName);
  }

}

function processUploadedTsReport(uploadedReport, callback) {
  log.info('About to process report: ' + uploadedReport._id);  
  log.info('            filename   : ' + uploadedReport.fileName);  
  try { 
    var trades = TradeStation.parseTradeStationExtractedText(uploadedReport.extractedText);
    _.each(trades, function(t){
      _.extend(t,{owner: uploadedReport.owner, reportRef: uploadedReport._id})
    });
    return callback(null, trades);
  } catch (e) {
    log.info(' error proceesing rep: ' + uploadedReport._id);  
    log.info(' error:  ' + e);
    return callback('failed on ' + uploadedReport.fileName);
  }
}
function processEmailUpload(report, callback) {
  var mailMsg = report.mailObj;
  if (mailMsg.subject.indexOf('Interactive Brokers Daily Trade Report') != -1) {
    Models.User.findOne({reportDropboxAddr : { $in: mailMsg.to}},function(err,usr) {
      if (err) return callback(err);
      if (!usr) return callback('Could not get user for db address: ' + mailMsg.to);
      if ((report.processed === false) &&
          (report.fileName.indexOf('DailyTradeReport') != -1)) {
        var trades = 
              Ib.parseEmailedReportString(report.content, usr._id, mailMsg._id, report._id);
        report.owner = usr._id;
        return report.save(function() { return callback(null, trades);}); 
      }
    });
  } else {
    var s = 'Ignoring message with subject: ' + mailMsg.subject;
    log.info(s); return callback(s);
  }
} 
