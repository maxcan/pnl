var ImapConnection = require('imap').ImapConnection;
var fs = require('fs');
var mailparser = require("mailparser");
var Models = require("../models.js");
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
  { username: 'pnltracker@cantor.mx'
  , password: 'thxseiko'
  , host: 'imap.gmail.com'
  , port: 993
  , secure: true
  });

function show(obj) {
  return util.inspect(obj, false, Infinity);
}

function die(err) {
  console.log('Uh oh: ' + err);
  process.exit(1);
}

function openInbox(cb) {
  imap.connect(function(err) {
    if (err) die(err);
    imap.openBox('INBOX', true, cb);
  });
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
  Model.MailArchive.find()
                   .sort('-receivedDate')
                   .limit(1)
                   .exec(mostRecentMessageCallback);
}

openInbox(function(err, mailbox) {
  if (err) die(err);
  imap.search([ 'ALL', ['SINCE', 'May 20, 2010'] ], function(err, results) {
    if (err) die(err);
    var fetch = imap.fetch(results, {
      request: { headers: false, body: 'full'}
    });
    fetch.on('message', function(msg) {

      var fds = {} ; 
      var filenames = {} ; 
      var parser = new mailparser.MailParser({streamAttachments: true}) ; 

      parser.on("attachment", function(attachment){
        console.log('-1-1-1-1-1-  attachedment');  // _DEBUG
            var output = fs.createWriteStream("/tmp/" + attachment.generatedFileName);
                attachment.stream.pipe(output);
      });

      parser.on("end", function(mail){
        console.log('parser end');  // _DEBUG
        if (mail.attachments) console.log('attachments: ' + JSON.stringify(mail.attachments));  // _DEBUG
        console.log('to: ' + mail.to);  // _DEBUG
        console.log('subject: ' + JSON.stringify(mail.subject));  // _DEBUG
        console.log('from: ' + JSON.stringify(mail.from));  // _DEBUG
      });

      msg.on("data", function(data) { 
        return parser.write(data.toString()); });
      msg.on("end", function() { return parser.end(); });

      console.log('Finished message. Headers ' + show(msg));
    });
    fetch.on('end', function() {
      console.log('Done fetching all messages!');
      imap.logout(console.log);
    });
  });
});
