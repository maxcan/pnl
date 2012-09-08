var Ib = require("../lib/parsers/ib.js");
var Models = require("../models.js");
var assert = require('assert');
var fs = require('fs');


exports["Ib Should Exist"] = function() {
  assert.isNotNull(Ib);
  assert.isNotNull(Models);
} 

exports["Ib should read file"] = function() {
  return ; 
  fs.readFile("../assets/ib_sample.html", "utf8", function(fsErr,data) {
    if (fsErr) assert.fail(fsErr);
    assert.eql(data.substring(0,6), "<HTML>");
    assert.isNotNull(data);
    var acct = Ib.parseString(data);
    assert.eql(acct, "U764128");
    
  });
}

exports["Should be able to create a user"] = function() {
  var saveCB = function() {
    Models.User.find({}, function(e,s) {
      if (e) {console.log('e'); }   // _DEBUG

      assert.eql(s.length, 1, 'Was able to insert a user');
    Models.closeConnection();
    });

  }; 
  var findCB = function(e,s) {
    if (e) {console.log('e'); }   // _DEBUG

    assert.eql(s.length, 0, 'User Collection is cleared');
    var usr = new Models.User({name: 'bob', email: 'bo@bo.com'});
    usr.save(saveCB);
  }; 
  var remCB = function() { Models.User.find({},findCB); } ;
  Models.User.remove({}, remCB);
}


exports['Model Utility Sort works'] = function() {
  var unsorted = [ {a:0,b:5},{a:1,b:2},{a:3,b:0}];
  var   sorted = [ {a:3,b:0},{a:1,b:2},{a:0,b:5},];
  assert.eql(Models.sortByField(unsorted, "b"), sorted);
}
