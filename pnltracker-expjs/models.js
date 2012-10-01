var mongoose = require('mongoose');
var conf    = require('./config.js').genConf();
var AppUtil = require('./appUtil.js');
var util = require('util');
var _ = require('underscore');
var db = mongoose.connect(conf.mongoDbUri) ; // , conf.mongoDbName);
// var db = mongoose.createConnection(conf.mongoDbUri) ; // , conf.mongoDbName);

// nodejistu:  mongoose.connect('mongodb://nodejitsu:e052b67bd8b033100b92965756b1d4b8@alex.mongohq.com:10087/nodejitsudb148589429036');

var Types = mongoose.Schema.Types;

exports.closeConnection = function() {db.close();}
var userSchema = new mongoose.Schema(
    { name              : String 
    , email             : { type: String, required: true}
    , roles             : [String]
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
  ret.reportDropboxAddr = conf.statementAddressPrefix + exports.randomString(8) + '@cantor.mx';
  return ret;
}; 

var securityTypes = ['stock','furure','option','cash','bond'];

var securitySchema = new mongoose.Schema(
    { symbol        : {type: String, required: true}
    , securityType  : {type: String , enum: securityTypes}
    , expDt         : Date
    , strike        : Number
    , multiplier    : {type: Number, default: 1, min: 1 }
    , putCall       : {type: String, enum: ['P','C']}
    , underlying    : {type: Types.ObjectId, ref: 'Security'}
    });

var fillSchema = new mongoose.Schema(
    { owner   : {type: Types.ObjectId, ref: 'User'}
    , date    : {type: Date, required: true}
    , qty     : {type: Number, required: true}
    , avgPx   : {type: Number, required: true}
    , fees    : Number // should generally be a negative number so we can add everything
    , symbol  : {type: String, required: true}
    , isOpen  : {type: Boolean, required: true}
    , acctId  : String
    });

fillSchema.virtual('netCash').get(function() {
  var mult = (this.symbol.length > 5 ? 100 : 1)
  return ((-1 * this.qty * this.avgPx * mult) + this.fees )
});

var tradeSchema = new mongoose.Schema(
    { owner     : {type: Types.ObjectId, ref: 'User', required: true}
    , symbol    : {type: String, required: true}
    , fills     : [fillSchema]
    , isOpen    : Boolean
    , acctId    : String
    , mailRef   : {type: Types.ObjectId, ref: 'MailArchive'}
    , uploadeRef: {type: Types.ObjectId, ref: 'Upload'} 
    });

tradeSchema.virtual('netCash').get(function() {
  return _.reduce(this.fills,function(sm,fl) {return sm + fl.netCash;},0);
});

tradeSchema.virtual('netQty').get(function() {
  return _.reduce(this.fills,function(sm,fl) {return sm + fl.qty;},0);
});

tradeSchema.virtual('totalBuy').get(function() {
  return _.reduce(this.fills,function(sm,fl) {return sm + (fl.qty > 0 ? fl.qty : 0);},0);
});

tradeSchema.virtual('openDate').get(function() {
  var fills = this.fills;
  if (fills.length === 0) return null;
  var dt = fills[0].date;
  _.each(fills, function(fl){if (fl.date < dt) dt = fl.date;});
  return dt;
});

tradeSchema.virtual('closeDate').get(function() {
  var fills = this.fills;
  if (fills.length === 0) return null;
  var dt = fills[0].date;
  _.each(fills, function(fl){if (fl.date > dt) dt = fl.date;});
  return dt;
});

tradeSchema.virtual('duration').get(function() {
  var cl = this.closeDate;
  if (cl) return cl-this.openDate; else return null;
});

tradeSchema.virtual('totalSell').get(function() {
  return _.reduce(this.fills,function(sm,fl) {return sm + (fl.qty < 0 ? fl.qty : 0);},0);
});

tradeSchema.virtual('vwapBuy').get(function() {
  var q = 0, p = 0;
  _.each(this.fills,function(fl) {
    if (fl.qty > 0) { q += fl.qty; p += (fl.qty * fl.avgPx);}
  });
  if (q) return (p / q);
  return null;
});

tradeSchema.virtual('vwapSell').get(function() {
  var q = 0, p = 0;
  _.each(this.fills,function(fl) {
    if (fl.qty < 0) { q += fl.qty; p += (fl.qty * fl.avgPx);}
  });
  if (q) return Math.abs(p / q);
  return null;
});


tradeSchema.virtual('maxPrin').get(function() {
  return (this.fills[0].qty > 0 ? this.totalBuy  * this.vwapBuy
                                : Math.abs(this.totalSell * this.vwapSell ));
});



var uploadSchema = new mongoose.Schema(
    { owner         : {type: Types.ObjectId, ref: 'User'}
    , mimeType      : String
    , content       : Buffer
    , extractedText : [String]
    });
var mailAttachmentSchema = new mongoose.Schema(
    { name      : String
    , mimeType  : String
    , content   : String
    , processed : Boolean
    });

var mailArchiveSchema = new mongoose.Schema(
    { owner         : {type: Types.ObjectId, ref: 'User'}
    , to            : [String]
    , from          : String
    , subject       : String
    , raw           : String
    , receivedDate  : Date
    , msgId         : String
    , attachments   : [mailAttachmentSchema]
    });


var User  = db.model('User', userSchema);
exports.User = User;
var Upload = db.model('Upload', uploadSchema);
exports.Upload = Upload;
var MailArchive  = db.model('User', mailArchiveSchema);
exports.MailArchive = MailArchive;
var Fill = db.model('Fill', fillSchema);
exports.Fill = Fill;
var Trade = db.model('Trade', tradeSchema);
exports.Trade = Trade;
var Security = db.model('Security', securitySchema);
exports.Security = Security;
var MailArchive = db.model('MailArchive', mailArchiveSchema);
exports.MailArchive = MailArchive;

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
  var curQty = AppUtil.sum(_.pluck(trade.fills,'qty'));
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
