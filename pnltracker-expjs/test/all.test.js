var Ib = require("../lib/parsers/ib.js");
// var Fetcher = require("../lib/statement_fetcher");
var Models = require("../models.js");
var AppUtil = require('../util.js');
var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var exec = require('child_process').exec;
var watch = require('watch');

var ParseFixtures = require('./fixtures/parse_trade_output.js');

exports["Ib Should Exist"] = function() {
  assert.isNotNull(Ib);
  assert.isNotNull(Models);
} 

exports["Mail"] = function() {
  return ; 
  // Fetcher.testInbox(console.log);
  assert.fail("test");
}
exports["AppUtil Functions unit testing"] = function() {
  var s = AppUtil.sum([1,2,2]);
  assert.eql(5,s ,"sum should be 5 but equals: "+  s);
}

exports["Ib should read generated file"] = function() {
  fs.readFile("../assets/ib_sample.html", "utf8", function(fsErr,data) {
    if (fsErr) assert.fail(fsErr);
    assert.eql(data.substring(0,6), "<HTML>");
    assert.isNotNull(data);
    var trades = Ib.parseGeneratedReportString(data);
    assert.eql(trades, ParseFixtures.ibGeneratedSampleTrades);
    
  });
}

exports["Ib should read emailed file"] = function() {
  fs.readFile("../assets/ib_email_sample.html", "utf8", function(fsErr,data) {
    if (fsErr) assert.fail(fsErr);
    assert.isNotNull(data);
    var trades = Ib.parseEmailedReportString(data);
    assert.eql(trades, ParseFixtures.ibEmailedSampleTrades);
    
  });
}

exports["Should be able to create a user"] = function() {
  var emailAddress = 'cleartest@example.com' ;
  var saveCB = function() {
    Models.User.find({email: emailAddress}, function(e,s) {
      if (e) {console.log('e'); }   // _DEBUG
      assert.eql(s.length, 1, 'Was able to insert a user');
    });

  }; 
  var findCB = function(e,s) {
    if (e) {console.log('e'); }   // _DEBUG

    assert.eql(s.length, 0, 'User Collection is cleared');
    var usr = new Models.User(Models.newUser({name: 'bob', email: emailAddress}));
    usr.save(saveCB);
  }; 
  var remCB = function() { Models.User.find({email: emailAddress},findCB); } ;
  Models.User.remove({}, remCB);
}

exports['Model Utility Sort works'] = function() {
  var unsorted = [ {a:0,b:5},{a:1,b:2},{a:3,b:0}];
  var   sorted = [ {a:3,b:0},{a:1,b:2},{a:0,b:5},];
  assert.eql(Models.sortByField(unsorted, "b"), sorted);
}

exports['Fill splitting works'] = function() {
  var fill = {symbol:'a', date: new Date(2012,09,10), avgPx: 9, qty: 10, fees: 0.4};
  var splitCash = AppUtil.sum(_.map(Models.splitFill(fill, -7), Models.netCashForFill));
  assert.eql(Models.netCashForFill(fill), splitCash);
  Models.User.create(Models.newUser({name: 'a', email: 'a@a.com'}), function(e,u) {
    if (e) assert.fail('user creation');
      Models.Fill.create(fill, function(f, newFill) {
        if (f) assert.fail('could not create a fill');
        assert.eql(Models.netCashForFill(fill),newFill.netCash);
      });
    Models.User.remove({});
  });
} 

exports['Fill grouping works'] = function() {
  var t0 = new Date(2012,09,10);
  var t1 = new Date(2012,09,11);
  var t2 = new Date(2012,09,12);
  var ungrouped = 
    [ { symbol: 'a', avgPx: 1.4, fees: 0.001, date: t1, qty: 3}
    , { symbol: 'a', avgPx: 1.3, fees: 0.001, date: t2, qty: -2} 
    , { symbol: 'b', avgPx: 1.5, fees: 0.001, date: t1, qty: 2} 
    , { symbol: 'a', avgPx: 1.7, fees: 0.001, date: t0, qty: -1} 
    , { symbol: 'b', avgPx: 1.9, fees: 0.001, date: t2, qty: -2} ]
  var control = 
    { a: [ { symbol: 'a', avgPx: 1.7, fees: 0.001, date: t0, qty: -1}
         , { symbol: 'a', avgPx: 1.4, fees: 0.001, date: t1, qty: 3} 
         , { symbol: 'a', avgPx: 1.3, fees: 0.001, date: t2, qty: -2} ]
    , b: [ { symbol: 'b', avgPx: 1.5, fees: 0.001, date: t1, qty: 2} 
         , { symbol: 'b', avgPx: 1.9, fees: 0.001, date: t2, qty: -2} ]
    }
  var grouped = Models.groupFills(ungrouped) ;
  assert.eql(control, grouped,'Fill Grouping');
  // Create a user for the rest of the tests
  var asyncTests = function () {
    var createCB = function(err, usr) {
      if (err) throw err;
      for (i in ungrouped) {ungrouped[i].owner = usr;}
      Models.mkTradesAndSave(usr, ungrouped);
    };
    var remUserCB = function() { Models.User.create(Models.newUser({name:'n',email:'b@b.com'}), createCB) ; } ;
    var remTradeCB = function() { Models.User.remove({}, remUserCB);};
    Models.Trade.remove({},remTradeCB);
  };

  setTimeout(asyncTests, 500); // need to wait for user test
} 

exports['Check fill grouping results'] = function() {
  var checkGroupedTrades = function(err, trades) {
    if (err) throw err;
    assert.eql(trades.length, 3);
    assert.eql(trades[0].symbol, 'a');
    assert.eql(trades[0].fills.length, 2);
    assert.eql(trades[0].fills[0].qty, -1);
    assert.eql(trades[1].symbol, 'a');
    assert.eql(trades[2].fills.length, 2);
    assert.eql(trades[2].symbol, 'b');
    assert.eql(trades[2].fills.length, 2);
    assert.eql(trades[2].symbol, 'b');
    Models.Trade.remove({});
  } ; 
  var findGroupedTrades = function(err) {
    if (err) throw err;
    Models.Trade.find({}).sort('symbol').exec(checkGroupedTrades);
  } ;
  setTimeout(findGroupedTrades, 750); // need to wait for user test

}
exports['Database should close'] = function()  {
  this.on('exit', function() { Models.closeConnection(); });
  setTimeout(Models.closeConnection, 1500);
}
