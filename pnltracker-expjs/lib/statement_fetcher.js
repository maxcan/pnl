var ImapConnection = require('imap').ImapConnection;
var util = require('util');

console.log(' about to build the imap connection');  // _DEBUG
var imap = new ImapConnection(
  { username: 'pnltracker@cantor.mx'
  , password: 'thxseiko'
  , host: 'imap.gmail.com'
  , port: 993
  , secure: true
  });


console.log('built the imap object');  // _DEBUG

  function show(obj) {
    return util.inspect(obj, false, Infinity);
  }

  function die(err) {
    console.log('Uh oh: ' + err);
    process.exit(1);
  }

  function openInbox(cb) {
    console.log('about to connect');  // _DEBUG
    imap.connect(function(err) {
      if (err) die(err);
      console.log(' about to open the obx');  // _DEBUG
      imap.openBox('INBOX', true, cb);
    });
  }

  openInbox(function(err, mailbox) {
    if (err) die(err);
    console.log('about to open the inbox');  // _DEBUG
    imap.search([ 'UNSEEN', ['SINCE', 'May 20, 2010'] ], function(err, results) {
      console.log(' searching..');  // _DEBUG
      if (err) die(err);
      var fetch = imap.fetch(results, {
        request: {
          headers: ['from', 'to', 'subject', 'date']
        }
      });
      fetch.on('message', function(msg) {
        console.log('Got a message with sequence number ' + msg.seqno);
        msg.on('end', function() {
          // msg.headers is now an object containing the requested headers ...
          console.log('Finished message. Headers ' + show(msg.headers));
        });
      });
      fetch.on('end', function() {
        console.log('Done fetching all messages!');
        imap.logout(console.log);
      });
    });
  });
