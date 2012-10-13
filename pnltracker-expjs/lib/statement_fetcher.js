var ImapConnection = require('imap').ImapConnection;
var BrokerReportManager = require('../lib/broker_report_manager.js');
var conf    = require('../config.js').genConf() ;
var _ = require('underscore');
var async = require('async') ;
var Ib = require("../lib/parsers/ib.js");
var fs = require('fs');
var mailparser = require("mailparser");
var Models = require("../models.js");
var ModelsTrade = require("../models/trade");
var util = require('util');

/*******************************************************************************
 * Statement Fetcher Specs:
 *  1) should download messages one XXX mail account
 *  2) determine who "owns" the statement or 
 *  3) pass it through to one of the statement parsers to extract trading data.
 *  4)
 *
 *******************************************************************************/

var imap = new ImapConnection(
  { username: conf.imapFetchUsername + '@' + conf.statementAddressHost
  , password: conf.imapFetchPassword
  , host:     conf.imapFetchHost
  , port:     conf.imapFetchPort
  , secure: true
  });

var imapIsConnected = false; 
function show(obj) {
  return util.inspect(obj, false, Infinity);
}

function die(err) {
  console.log('Uh oh: ' + err);
  process.exit(1);
}

function openInbox(cb) {
  if (imapIsConnected) {
    imap.openBox('INBOX', false, cb);
  } else { 
    console.log('About to connect to mail');  // _DEBUG
    imap.connect(function(err) {
      if (err) {
        console.log('ERROR erorr in imap ocnnection: ' + err);  // _DEBUG
        
      } else { 
        console.log('connected');  // _DEBUG
        imapIsConnected = true;
        imap.openBox('INBOX', false, cb);
      }
    });
  }
}

function mostRecentMessage(cb) {
  var  mostRecentMessageCallback = function (err, msgObj) {
    if (err) throw err;
    if (msgObj == null || msgObj === null || msgObj.receivedDate == null) {
      return cb(null, new Date('2000-01-01'));
    } else {
      return cb(null, msgObj.receivedDate);
    }
  };
  Models.MailArchive.find()
                   .sort('-receivedDate')
                   .limit(1)
                   .exec(mostRecentMessageCallback);
};


exports.checkMail = function( ) {
  openInbox(function(err, mailbox) {
    if (err) die(err);
    imap.search([ 'UNSEEN'], function(err, results) {
      if (err)  {
        console.log(' error in check mail: ' + err); 
        throw err;
      }
      if (results.length != 0) { 
        var fetch = imap.fetch(results
          , { request: { headers: false, body: 'full'} 
            , markSeen: true 
          });
        fetch.on('message', function(msg) {
          var parser = new mailparser.MailParser({streamAttachments: false}) ; 
          parser.on("end", function(mail){
            if (mail.attachments.length != 0) {
              var reportIds = [];
              var mailObj = { to      : _.pluck(mail.to, 'address')
                            , from    : mail.from[0].address
                            , subject : mail.subject 
                            , receivedDate  : new Date()
                            , }
              Models.MailArchive.create(mailObj, function(err, mailArchive) {
                if (err) { throw err; }
                // exports.processMailArchive(err, mailArchive);
                async.forEach(mail.attachments, saveAttachment, processReportIds) ;
                function processReportIds(err) {
                  if (err) {
                    console.log('ERROR in processReportIds: '+ err);  // _DEBUG
                    throw err;
                  }
                  mailArchive.attachments = reportIds;
                  mailArchive.save(function(err) {
                    if (err) {
                      console.log('ERROR in processReportIds: '+ err);  // _DEBUG
                      throw err;
                    }
                  });
                }
                function saveAttachment(attachment, asyncCallback) {
                  Models.BrokerReport.create(
                    { uploadMethod  : 'email'
                    , mimeType      : attachment.contentType
                    , fileName      : attachment.fileName
                    , content       : attachment.content
                    , extractedText : [attachment.content.toString()]
                    , mailRef       : mailArchive._id
                    , processed     : false
                    }, function(err, report) {
                      if (err) return asyncCallback(err);
                      reportIds.push(report._id);
                      report.mailObj = mailArchive;
                      return BrokerReportManager.processUpload(report, asyncCallback);
                    });
                }
              });
            }
          });

          msg.on("data", function(data) { 
            return parser.write(data.toString()); });
          msg.on("end", function() { return parser.end(); });

        });
        // fetch.on('end', function() { return ; });
      }
    });
  });
} ;

