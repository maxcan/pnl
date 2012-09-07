var Ib = require("../lib/parsers/ib.js");
var Models = require("../models.js");
var assert = require('assert');
var fs = require('fs');


exports["Ib Should Exist"] = function() {
  assert.isNotNull(Ib);
  assert.isNotNull(Models);
} 

exports["Ib should read file"] = function() {
  fs.readFile("../assets/ib_sample.html", "utf8", function(fsErr,data) {
    if (fsErr) assert.fail(fsErr);
    assert.eql(data.substring(0,6), "<HTML>");
    assert.isNotNull(data);
    var acct = Ib.parseString(data);
    assert.eql(acct, "U764128");
    
  });
}

exports["Should be able to create a user"] = function() {
  Models.User.remove({});
  Models.User.find({}, function(e,s) {
    if (e) {console.log('e'); }   // _DEBUG

    assert.eql(s.length, 0);
    var usr = new Models.User({name: 'bob', email: 'bo@bo.com'});
    usr.save();
    Models.User.find({}, function(e,s) {
      if (e) {console.log('e'); }   // _DEBUG

      assert.eql(s.length, 1);
    });
  });
}
