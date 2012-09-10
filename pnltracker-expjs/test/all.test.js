var Ib = require("../lib/parsers/ib.js");
var Models = require("../models.js");
var Util = require('../util.js');
var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var exec = require('child_process').exec;
var watch = require('watch');

// var lastRun = null;
// watch.watchTree('.', {ignoreDotFiles: true, filter: function(s) {s.indexOf('.js') != -1 }}, function() {
//   var d = new Date();
//   if (lastRun == null || (d - lastRun) > 5000) {
//     console.log('gonna run expresso');  // _DEBUG
//     try { 
//       exec('expresso', function (error, stdout, stderr) {
//         console.log('stdout: ' + stdout);
//         console.log('stderr: ' + stderr);
//         if (error !== null) {
//           console.log('exec error: ' + error);
//         }
//       });
//       lastRun = d;
//     } catch (e) {console.log('ex : '+e);}
//     }
//   });
// 

exports["Ib Should Exist"] = function() {
  assert.isNotNull(Ib);
  assert.isNotNull(Models);
} 

exports["Util Functions unit testing"] = function() {
  var s = Util.sum([1,2,2]);
  assert.eql(5,s ,"sum should be 5 but equals: "+  s);
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
exports['Fill splitting works'] = function() {
  var fill = {symbol:'a', date: new Date(2012,09,10), avgPx: 9, qty: 10, fees: 0.4};
  var splitCash = Util.sum(_.map(Models.splitFill(fill, -7), Models.netCashForFill));
  assert.eql(Models.netCashForFill(fill), splitCash);
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
      Models.groupTrades(usr, ungrouped);
    };
    var remUserCB = function() { Models.User.create({name:'n',email:'b@b.com'}, createCB) ; } ;
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
