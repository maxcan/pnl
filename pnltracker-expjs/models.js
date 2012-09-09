var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'test');
exports.closeConnection = function() {db.close();}
var userSchema = new mongoose.Schema(
    { name: 'string' 
    , email: 'string'
    });

var fillSchema = new mongoose.Schema(
    { owner   : 'ObjectId'
    , date    : 'Date'
    , qty     : 'Number'
    , avgPx   : 'Number'
    , fees    : 'Number'
    , symbol  : 'String'
    , isOpen  : 'Boolean'
    });

var tradeSchema = new mongoose.Schema(
    { owner     : 'ObjectId'
    , symbol    : 'String'
    , openDate  : 'Date'
    , fills     : [fillSchema]
    , isOpen    : 'Boolean'
    // , isLong    : 'Boolean'
    });

var User  = db.model('User', userSchema);
exports.User = User;
var Trade = db.model('Trade', tradeSchema);
exports.Trade = Trade;

////////////////////////////////////////////////////////////////////////////////
// Trade Grouping 
////////////////////////////////////////////////////////////////////////////////

function openTradeForUserSymbol(owner, symbol, callback) {
  console.log('open tusi sym = ' +  symbol);  // _DEBUG
  Trade.findOne({isOpen: true, symbol:symbol, owner:owner})
       .sort('-date')
       .exec(callback);
}

function sortByField(ls, fldName) {
  function cmp(a,b) { 
    if (a[fldName] < b[fldName]) return -1;
    if (a[fldName] > b[fldName]) return 1;
    return 0;
  }
  var newArr = ls.slice(0);
  newArr.sort(cmp);
  return newArr;
}

function groupFills(unsortedFills) {
  var fills = sortByField(unsortedFills, 'date');
  var groupedFills = {};
  for (var fillIdx in fills) { 
    var fill = fills[fillIdx];
    if (groupedFills[fill.symbol]) groupedFills[fill.symbol].push(fill)
    else groupedFills[fill.symbol] = [fill];
  }
  return groupedFills;
}

// add a single fill to a trade.  
// this will mutate the trade and possibly create another trade. 
function addFillToTrade(trade, fills, symbol, callback) {
  // this can definitely be sped up a bit..
  if (fills === null || fills.length === 0) { return trade.save(callback); }
  for (var idx in fills) {
    if (fills[idx].symbol != symbol) 
      throw new Error ("mismatched symbol in addFillToTrade"); 
  }
  if (trade.symbol != symbol) 
    throw new Error ("mismatched symbol in addFillToTrade"); 
  var curQty = 0;
  for (var idx in curTrade.fills) {curQty += curTrade.fills[idx].qty; }
  var curFill = curFills.shift();
  if (curQty + curFill.qty === 0) {
    // clean close
    console.log('clean close');  // _DEBUG
    trade.fills.push(curFill);
    trade.isOpen = false;
    trade.save(function cleanSave(err) {
      if (err) throw err;
      newTrade(trade.owner, symbol).save(function cleanSaveNewTrade(err, nextTrade) {
        console.log('clean close inner inner callback');  // _DEBUG
        addFillToTrade(nextTrade, fills, symbol, callback);
      });
    });

  } else if (curQty > 0 && (curFill.qty + curQty < 0)) {
    // dirty close from the long side
    // just break the fill  in two and re run
    var newFills = splitFill(curFill, curQty).concat(fills);
    addFillToTrade(trade, newFills, symbol, callback);
  } else if (curQty < 0 && (curFill.qty + curQty > 0)) {
    // dirty close from the short side
    var newFills = splitFill(curFill, curQty).concat(fills);
    addFillToTrade(trade, newFills, symbol, callback);
  } else {
    // now were just adding to a position
    trade.fills.push(curFill);
    addFillToTrade(trade, fills, symbol, callback);
  }

}

function netCashForFill(fill) {
  return ((-1 * fill.qty * fill.avgPx) - fill.fees)
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
function newTrade(o, s) { return new Trade({owner:o, symbol:s, fills:[], isOpen: true}); }

function groupTrades(owner, fills, callback) {
  // 1) group trades by symbol..
  var groupedFills = groupFills(fills);
  var groupSymbol = function(curSym) {
    openTradeForUserSymbol(owner, mutSym, function openTradeCb(err, curTrade) {
      var curFills = groupedFills[curSym];
      if (curFills.length === 0) return; 
      if (err) throw err;
      if (curTrade === null) {
        curTrade = newTrade();
        // curTrade.isLong = isLong;
        curFills[0].qty > 0 ;
      }
      var curQty = 0;
      for (var idx in curTrade.fills) {curQty += curTrade.fills[idx].qty; }
      for (var fillIdx in groupedFills[curSym]) {
        var curFill = curFills[fillIdx];
        // check if this fill is closing the trade

      }
    });
  };
  for (var mutSym in groupedFills) { groupSymbol(mutSym); }
  // 2) sort each group
  // 3) add to any existing trades or create a new one.  
  //   a) each time we add, check to see if we are opening a new position
  //      or adding or closing an existing one

  // check if the user already has an open position in this symbol
}
exports.groupFills = groupFills;
exports.groupTrades = groupTrades ;
exports.sortByField = sortByField ; 
exports.netCashForFill = netCashForFill;
exports.splitFill = splitFill;
