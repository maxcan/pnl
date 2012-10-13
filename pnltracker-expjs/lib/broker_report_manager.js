var _ = require('underscore');
var Models = require("../models.js");
var ModelsTrade = require("../models/trade");
var async = require('async') ;
var Ib = require("../lib/parsers/ib.js");

exports.processUpload = function (report, callback) {
  if (report.uploadMethod === 'email') {
    if (report.mailObj) return processEmailUpload(report, callback);
    if (report.mailRef) {
      return Models.MailArchive.findById(report.mailRef, function(e,ma) {
        if (e) return callback(e);
        if (!ma)
          return callback('could not load mail record for upload');
        report.mailObj = ma;
        return processEmailUpload(report, callback);
      });
    }
  } else if (report.uploadMethod === 'upload') {
    return processUploadedReport(report, callback)
  } else { return callback('unsupported report type'); }
};

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
        ModelsTrade.mkTradesAndSave(usr._id, trades, function(err) {
          if (err) {throw err; }
          report.processed = true;
          mailMsg.save();

        });
      }
    });
  }
} 
