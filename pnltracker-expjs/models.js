var mongoose = require('mongoose');
var Util = require('./util.js');
var _ = require('underscore');
var db = mongoose.createConnection('localhost', 'test');
var Types = mongoose.Schema.Types;

exports.closeConnection = function() {db.close();}
var userSchema = new mongoose.Schema(
    { name              : String 
    , email             : String
    , openId            : String
    , openIdProfile     : String
    , reportDropboxAddr  : [String]
    });

exports.randomString = function(len) {
  var chars = "0123456789bcdfghklmnpqrstvwxyz";
  var randomString = '';
  for (var i=0; i < len; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomString += chars.substring(rnum,rnum+1);
  }
  return randomString;
}; 

exports.newUser = function(obj) {
  var ret = {};
  if (obj) {
    ret.email = obj.email;
    ret.name = obj.name;
  }
  ret.reportDropboxAddr = 'pnltracker+' + exports.randomString(8) + '@cantor.mx';
  return ret;
}; 

var fillSchema = new mongoose.Schema(
    { owner   : {type: Types.ObjectId, ref: 'User'}
    , date    : Date
    , qty     : Number
    , avgPx   : Number
    , fees    : Number
    , symbol  : String
    , isOpen  : Boolean
    , acctId  : String
    });

fillSchema.virtual('netCash').get(function() {
  return ((-1 * this.qty * this.avgPx) - this.fees)
});

var tradeSchema = new mongoose.Schema(
    { owner     : {type: Types.ObjectId, ref: 'User'}
    , symbol    : String
    , openDate  : Date
    , fills     : [fillSchema]
    , isOpen    : Boolean
    , acctId    : String
    // , isLong    : 'Boolean'
    });

tradeSchema.virtual('netCash').get(function() {
  var fillArr = this.fills;
  return _.reduce(this.fills,function(sm,fl) {return sm + fl.netCash;},0);
});

tradeSchema.virtual('netQty').get(function() {
  var fillArr = this.fills;
  return _.reduce(this.fills,function(sm,fl) {return sm + fl.qty;},0);
});

var mailAttachmentSchema = new mongoose.Schema(
    { name      : String
    , mimeType  : String
    , content   : String
    });

var mailArchiveSchema = new mongoose.Schema(
    { owner         : {type: Types.ObjectId, ref: 'User'}
    , to            : String
    , from          : String
    , subject       : String
    , raw           : String
    , receivedDate  : Date
    , msgId         : String
    , attachments   : [mailAttachmentSchema]
    });


var User  = db.model('User', userSchema);
exports.User = User;
var MailArchive  = db.model('User', mailArchiveSchema);
exports.MailArchive = MailArchive;
var Fill = db.model('Fill', fillSchema);
exports.Fill = Fill;
var Trade = db.model('Trade', tradeSchema);
exports.Trade = Trade;

////////////////////////////////////////////////////////////////////////////////
// Trade Grouping 
////////////////////////////////////////////////////////////////////////////////

function openTradeForUserSymbol(owner, symbol, callback) {
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
function addFillsToTrade(trade, fills, symbol, callback) {
  // this can definitely be sped up a bit..
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
  var curQty = Util.sum(_.pluck(trade.fills,'qty'));
  var curFill = fills.shift();
  if (curQty + curFill.qty === 0) {
    // clean close
    trade.fills.push(curFill);
    trade.isOpen = false;
    trade.save(function cleanSave(err) {
      if (err) throw err;
      addFillsToTrade(newTrade(trade.owner, symbol), fills, symbol, callback);
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

function mkTradesAndSave(owner, fills, callback) {
  // 1) group trades by symbol..
  var groupedFills = groupFills(fills);
  var remainingTrades = _.keys(groupedFills).length;
  var groupSymbol = function(curFills, curSym) {
    openTradeForUserSymbol(owner, curSym, function openTradeCb(err, curTrade) {
      if (curFills.length === 0) return; 
      if (err) throw err;
      if (curTrade === null) {
        curTrade = newTrade(owner, curSym);
        curFills[0].qty > 0 ;
      }
      // var curQty = 0;
      // for (var idx in curTrade.fills) {curQty += curTrade.fills[idx].qty; }
      // for (var fillIdx in groupedFills[curSym]) {
      addFillsToTrade(curTrade, curFills, curSym, function() {
        remainingTrades--;
        if (remainingTrades === 0 && callback) callback();
      } );
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
exports.groupFills = groupFills;
exports.mkTradesAndSave = mkTradesAndSave ;
exports.sortByField = sortByField ; 
exports.netCashForFill = netCashForFill;
exports.splitFill = splitFill;
