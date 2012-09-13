var ImapConnection = require('imap').ImapConnection;
var mailparser = require("mailparser");
var Models = require("../models.js");
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
  console.log('about to open the inbox');  // _DEBUG
  imap.search([ 'ALL', ['SINCE', 'May 20, 2010'] ], function(err, results) {
    console.log(' searching..');  // _DEBUG
    if (err) die(err);
    var fetch = imap.fetch(results, {
      // request: { headers: ['from', 'to', 'subject', 'date'], body: 'full' }
      request: { headers: true, body: true}
    });
    fetch.on('message', function(msg) {
      console.log('Got a message with sequence number ' + msg.seqno);


      var fds = {} ; 
      var filenames = {} ; 
      var parser = new mailparser.MailParser() ; 

      console.log('-------------------- creating parser ');  // _DEBUG
      parser.on("headers", function(headers) { console.log("Message: " + headers.subject);});


      parser.on("astart", function(id, headers) {
        filenames[id] = headers.filename; 
        fds[id] = fs.openSync("/tmp/" + headers.filename, 'w');
      });

      parser.on("astream", function(id, buffer) { 
        fs.writeSync(fds[id], buffer, 0, buffer.length, null);
      });

      parser.on("aend", function(id) {
        if (! fds[is] ) return;
        fs.close(fds[id], function(err) {
          if (err) return console.error(err);
          console.log("Writing " + filenames[id] + " completed");
        });
      });
      msg.on("data", function(data) { 
        console.log('data handler');  // _DEBUG
        console.log('data: ' + data.toString());  // _DEBUG
        return parser.write(data.toString()); });
      msg.on("end", function() { return parser.end(); });

        // msg.on('end', function() {


      console.log('Finished message. Headers ' + show(msg));




        // msg.headers is now an object containing the requested headers ...
    });
    fetch.on('end', function() {
      console.log('Done fetching all messages!');
      imap.logout(console.log);
    });
  });
});
