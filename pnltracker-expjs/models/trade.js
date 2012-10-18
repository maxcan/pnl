
var util = require('util');
var AppUtil = require('../appUtil.js');
var _ = require('underscore');
var Models = require("../models.js");
var Sym = require("../lib/symbology");

exports.groupFills = groupFills;
exports.mkTradesAndSave = mkTradesAndSave ;
exports.splitFill = splitFill;

function mkNewTrade(o, s, callback) {
  Sym.securityForRawSymbol(s, function(err, security) {
    if (err) return callback(err);
    var newTrade =  { owner:o
                    , symbol:s
                    , fills:[]
                    , security: security
                    , isOpen: true};
    return callback(null, Models.Trade( newTrade)); 
  });
}

function mkTradesAndSave(owner, fills, callback) {
  // 1) group trades by symbol..
  if (!callback) { callback = function(e) { if (e) console.log('ex: ' + e);}}
  var groupedFills = groupFills(fills);
  var remainingTrades = _.keys(groupedFills).length;
  var groupSymbol = function(currentFillGroup, curSym) {
    // see if the user has any open trades..
    openTradeForUserSymbol(owner, curSym, function openTradeCb(err, curTrade) {
      if (currentFillGroup.length === 0) return; 
      if (err) throw err;
      if (curTrade === null) {
        mkNewTrade(owner, curSym, function(err, newTrade) {
          if (err) {
            // probably a bad symbol..
            console.log('Error makign a fresh trade: ' + err); 
            remainingTrades--;
            if (remainingTrades === 0 && callback) return callback();
          } else {
            addFillsToTrade(newTrade, currentFillGroup, curSym, function() {
              remainingTrades--;
              if (remainingTrades === 0 && callback) return callback();
            } );
          }
          
        });
      } else {
        addFillsToTrade(curTrade, currentFillGroup, curSym, function() {
          remainingTrades--;
          if (remainingTrades === 0 && callback) return  callback();
        } );

      }
      // var curQty = 0;
      // for (var idx in curTrade.fills) {curQty += curTrade.fills[idx].qty; }
      // for (var fillIdx in groupedFills[curSym]) {
      });
    
    };
  _.each(groupedFills, groupSymbol);
  // for (var mutSym in groupedFills) { groupSymbol(mutSym); }
  // 2) sort each group
  // 3) add to any existing trades or create a new one.  
  //   a) each time we add, check to see if we are opening a new position
  //      or adding or closing an existing one

  // check if the user already has an open position in this symbol
}

function splitFill(fill, qty) {
  var fstFill = { owner   : fill.owner
                , date    : fill.date
                , qty     : -1 * qty
                , avgPx   : fill.avgPx
                // technically this is wrong but fuck it
                , fees    : fill.fees / 2 
                , symbol  : fill.symbol
                }
  var sndFill = { owner   : fill.owner
                , date    : fill.date
                , qty     : fill.qty + qty
                , avgPx   : fill.avgPx
                // technically this is wrong but fuck it
                , fees    : fill.fees / 2 
                , symbol  : fill.symbol
                }
  if (qty < 0) {
    //short
    if (fill + qty < 0) { return [fill]; }
    return [fstFill, sndFill] ; 
  } else {
    if (fill < qty) { return [fill]; }
    return [fstFill, sndFill] ; 
  }

}

////////////////////////////////////////////////////////////////////////////////
// Trade Grouping 
////////////////////////////////////////////////////////////////////////////////

function openTradeForUserSymbol(owner, symbol, callback) {
  Models.Trade.findOne({isOpen: true, symbol:symbol, owner:owner})
        .sort('-date')
        .exec(callback);
}

function groupFills(unsortedFills) {
  var fills = _.sortBy(unsortedFills, 'date');
  var groups =  _.groupBy(fills, 'symbol');
  return groups;
}

// add a single fill to a trade.  
// this will mutate the trade and possibly create another trade. 
function addFillsToTrade(trade, fills, symbol, callback) {
  // this can definitely be sped up a bit..
  if (!trade) {
    console.log(' trade is null in addFillsToTrade: fills: ' + util.inspect(fills));  
    console.log('symbol: ' + util.inspect(symbol));  
    throw new Error('trade is null in addFillsToTrade.  not good');
  }
  if (fills === null || fills.length === 0) { 
    if (trade.fills.length > 0) return trade.save(callback); 
    return callback();
  }
  for (var idx in fills) {
    if (fills[idx].symbol != symbol) 
      throw new Error ("mismatched symbol in addFillsToTrade"); 
  }
  if (trade.symbol != symbol) 
    throw new Error ("mismatched symbol in addFillsToTrade"); 
  var curQty = AppUtil.sum(_.pluck(trade.fills,'qty'));
  var curFill = fills.shift();
  if (curQty + curFill.qty === 0) {
    // clean close
    trade.fills.push(curFill);
    trade.isOpen = false;
    trade.save(function cleanSave(err) {
      if (err) throw err;
      mkNewTrade(trade.owner, symbol, function(err, newTrade) {
        if (err) throw new Error('error creating new trade:'  + err);
        addFillsToTrade(newTrade, fills, symbol, callback);
      });
    });

  } else if (curQty > 0 && (curFill.qty + curQty < 0)) {
    // dirty close from the long side
    // just break the fill  in two and re run
    var newFills = splitFill(curFill, curQty).concat(fills);
    addFillsToTrade(trade, newFills, symbol, callback);
  } else if (curQty < 0 && (curFill.qty + curQty > 0)) {
    // dirty close from the short side
    var newFills = splitFill(curFill, curQty).concat(fills);
    addFillsToTrade(trade, newFills, symbol, callback);
  } else {
    // now were just adding to a position
    trade.fills.push(curFill);
    addFillsToTrade(trade, fills, symbol, callback);
  }

}
