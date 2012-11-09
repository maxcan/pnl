var ImapConnection = require('imap').ImapConnection;
var BrokerReportManager = require('../lib/broker_report_manager.js');
var conf    = require('../config.js').genConf() ;
var _ = require('underscore');
var async = require('async') ;
var log = require('../log')
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

function closeConnection() {
  try { imap.logout(); }  catch (e) {log.error('Error closing IMAP connection: ' + e);}  // _DEBUG
  imapIsConnected = false;
}

function die(err) {
  log.info('Uh oh: ' + err);
  process.exit(1);
}

function openInbox(cb) {
  if (imapIsConnected) {
    try { 
      imap.openBox('INBOX', false, cb);
    } catch (e) {
      console.log('Could not open inbox: ' + e.stack);  // _DEBUG
      closeConnection();
    }
  } else { 
    // log.info('About to connect to mail');  // _DEBUG
    imap.connect(function(err) {
      if (err) {
        log.info('ERROR erorr in imap ocnnection: ' + err);  // _DEBUG
        
      } else { 
        log.info('connected');  // _DEBUG
        imapIsConnected = true;
        try { 
          imap.openBox('INBOX', false, cb);
        } catch (e) {
          log.info('ERORR on openInbox: '+  e);
          closeConnection;
        }
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

// This funciton is used a callback to save the attachment IDs for a message.
// It got kind of long so pulling it out as a separate function
function saveAttachmentIdsForMail(mailArchive) {
  return function processReportIds(err, resMap) {
    if (err) {
      log.error('processReportIds: failed to save reports: error: ', err);  // _DEBUG
      mailArchive.hasError = true;
    }
    _.each(resMap, function(r) {
      var arrName = null;
      switch(r.repStatus) {
        case 'p': arrName = 'attachments' ; break;
        case 'u': arrName = 'unprocessedAttachments' ; break;
        case 'd': arrName = 'dupedAttachements' ; break;
        default: break;
      }
      if (arrName) {
        if (!mailArchive[arrName]) {
          mailArchive[arrName] = [r.repId];
        } else {
          mailArchive[arrName].push(r.repId);
        }
      }
    });
    mailArchive.save(function(err) {
      if (err) {
        log.error('Could Not Save attachments for email: ' + mailArchive._id + ' with error: ' + err);
        log.error('              mailArchive:        ' + util.inspect(mailArchive, false, null, true));
      }
    });
  }
}

function extractReport(mailArchive) {
  return function saveAttachment(attachment, asyncCallback) {
    Models.BrokerReport.create(
      { uploadMethod  : 'email'
      , mimeType      : attachment.contentType
      , fileName      : attachment.fileName
      , content       : attachment.content
      , extractedText : [attachment.content.toString()]
      , mailRef       : mailArchive._id
      , processed     : false
      }
      , function(err, report) {
        if (err) return asyncCallback(err);
        report.mailObj = mailArchive;
        return BrokerReportManager.processUpload(report, function chkDupeCallBack(err) {
          if (err) {
            if (err === BrokerReportManager.DuplicateUpload) {
              return asyncCallback(null, { repId: report._id, repStatus: 'd'} );
            }
            return asyncCallback(null, { repId: report._id, repStatus: 'u' } );
          }
          return asyncCallback(null, { repId: report._id, repStatus: 'p'});
        });
      });
  }
}

exports.checkMail = function( ) {
  openInbox(function(err, mailbox) {
    if (err) die(err);
    try { 
      imap.search([ 'UNSEEN'], searchCallback);
    } catch (e) {
      log.info('IMAP error: ' + e);  // _DEBUG
      return closeConnection() ; 
    }

    function searchCallback(err, results) {
      if (err)  {
        log.error(' error in check mail: ' + err); 
        return closeConnection(); 
      }
      if (results.length != 0) { 
        var fetch ;
        try {
          fetch = imap.fetch(results
            , { request: { headers: false, body: 'full'} , markSeen: true });
        } catch (e) {
          log.info('IMAP error: ' + e);  // _DEBUG
          return closeConnection();
        }
        fetch.on('message', function(msg) {
          var parser = new mailparser.MailParser({streamAttachments: false}) ; 
          parser.on("end", function(mail){
            if (mail.attachments && mail.attachments.length != 0) {
              var mailObj = { to      : _.pluck(mail.to, 'address')
                            , from    : mail.from[0].address
                            , seqno   : msg.seqno
                            , uid     : msg.uid
                            , mailDate: new Date(msg.date)
                            , subject : mail.subject 
                            , receivedDate  : new Date()
                            , }
              // log.info('About to save mail:', mailObj);
              Models.MailArchive.create(mailObj, function(err, mailArchive) {
                if (err) {
                  log.error('Could not create mail archive.', {imapSeqno: mail.seqno, imapUid: mail.uid});
                  return ; 
                }
                async.map(mail.attachments, extractReport(mailArchive), saveAttachmentIdsForMail(mailArchive)) ;
              });
            }
          });

          msg.on("data", function(data) { 
            return parser.write(data.toString()); });
          msg.on("end", function() { return parser.end(); });

        });
        // fetch.on('end', function() { return ; });
      }
    }
  });
} ;

