var Models = require("../models.js");
var util = require('util');
var AppUtil = require('../appUtil.js');
var _ = require('underscore');

exports.securityForRawSymbol = function(sym, callback) {
  // sample symbols:
  // { "symbol" : "ib:NKM11",
  // { "symbol" : "ib:AAPL",
  // { "symbol" : "ib:JNK",
  // { "symbol" : "ib:USD.JPY",
  // { "symbol" : "ib:AUD.USD"
  // { "symbol" : "ib:NKM11",
  // {  "symbol" : "ib:ZNGA 22DEC12 2.0 P" }
  // {  "symbol" : "ib:FB 19JAN13 15.0 P" }
  // {  "symbol" : "ib:FB 19JAN13 25.0 C" }
  // { "symbol" : "ts:SPY 120922P141"
  // { "symbol" : "ts:DIS 121020C50"
  // { "symbol" : "ts:AAPL 120922C675"
  // { "symbol" : "ts:SPY 120928P141"
  // { "symbol" : "ts:AAPL 121020C680"
  // { "symbol" : "ts:SLV 121020P32.5"
  // { "symbol" : "ts:AAPL 121020C670"
  // { "symbol" : "ts:GOOG 121020P740"
  // { "symbol" : "ts:GOOG 121020P735"
  // { "symbol" : "ts:FB 121020C23"
  // { "symbol" : "ts:KORS 121020C60"


  // Matched fields:           [ 'SPY 120928P141 2 2.69 Principal 538.00 MGN 81 84447',
  //    1: underlying symbol     'SPY',
  //    2: 20xx year             '12',
  //    3: month (01-12)         '09',
  //    4: day                   '28',
  //    5: C or P                'P',
  //    6: strike                '141',
  var patTsOption = /^ts:([A-Z]{1,5}) +(\d\d)(\d\d)(\d\d)(C|P)([0-9.]+)$/;

  //matched fields:
  //  1: undelying symbol
  //  2: day
  //  3: month (JAN,FEB,...)
  //  4: year 20xx
  //  5: strike
  //  6: P or C
  var patIbOption = /^ib:([A-Z]{1,5}) +(\d\d)([A-Z]{3})(\d\d) +([0-9.]+) +(P|C)$/;
  
  var patIbStock = /^ib:([A-Z]{1,5})$/;
  var patTsStock = /^ts:([A-Z]{1,5})$/;

  var getStock = function(stkSym) {
    var stkQuery = {symbol: stkSym, securityType: 'stock'};
    Models.Security.findOne(stkQuery, function(err, stk) {
      if (err) return callback(err);
      if (!stk) {
        return Models.Security.create(stkQuery, function(err, createdStk) {
          return callback(null, createdStk);
        });
      } else { return callback(null, createdStk);}
    });
  }
  var getOption = function (optionObj) {
    Models.Security.findOne(optionObj, function(err, opt) {
      if (err) return callback(err);
      if (opt) return callback(null, opt);
      // need to create teh option here:
      optionObj.symbol = sym;
      if (!optionObj.multiplier) optionObj.multiplier = 100;
      Models.Security.create(optionObj, function(err,newOpt) {
        if (err) return callback(err);
        return callback(null, newOpt);
      });
    });
  } ;
  var getOptUnderlying = function(undlSym, optionObj) {
    var undlQuery = {symbol: undlSym, securityType: 'stock'};
    Models.Security.findOne(undlQuery, function(err, undl) {
      if (err) return callback(err);
      if (!undl) {
        return Models.Security.create(undlQuery, function(err, createdUndl) {
          if (err) return callback(err);
          optionObj.underlying = createdUndl._id;
          return getOption(optionObj);
        });
      } else {
        optionObj.underlying = undl._id;
        return getOption(optionObj);
      }

    });
  };
  if (sym.indexOf('ib:') === 0) {
    // an IB symbol:
    var optMatch = sym.match(patIbOption);
    var stkMatch = sym.match(patIbStock);
    if (optMatch) {
      var dt = new Date('20'+optMatch[4]+'-'+optMatch[3]+'-'+optMatch[2]+' 12:00:00');
      var optionObj = { expDt: dt
                      , strike: Number(optMatch[5])
                      , putCall: optMatch[6]
                      , securityType: 'option'
                      } ; 
      return getOptUnderlying(optMatch[1], optionObj);
    } else if (stkMatch) {
      return getStock(stkMatch[1]);
    } else {
      return callback('could not match symbol: ' + sym);
    }

  } else if (sym.indexOf('ts:') === 0) {
    var optMatch = sym.match(patTsOption);
    var stkMatch = sym.match(patTsStock);
    if (optMatch) {
      var dt = new Date('20'+optMatch[2]+'-'+optMatch[3]+'-'+optMatch[4]+' 12:00:00');
      var optionObj = { expDt: dt
                      , strike: Number(optMatch[6])
                      , putCall: optMatch[5]
                      , securityType: 'option'
                      } ; 
      return getOptUnderlying(optMatch[1], optionObj);
    } else if (stkMatch) {
      return getStock(stkMatch[1]);
    } else {
      callback('could not match symbol: ' + sym);
    } 

  } else {
    callback('could not match symbol: ' + sym);
  } 

};

exports.securityForRawSymbol("ts:GOOG 121020P735", function(e,o) {
  if (e) console.log('error: ' + e );
  console.log(util.inspect(o,false,null, true));
});

exports.securityForRawSymbol("ib:ZNGA 22DEC12 2.0 P", function(e,o) {
  if (e) console.log('error: ' + e );
  console.log(util.inspect(o,false,null, true));
});

exports.securityForRawSymbol("ib:MSFT", function(e,o) {
  if (e) console.log('error: ' + e );
  console.log(util.inspect(o,false,null, true));
});
