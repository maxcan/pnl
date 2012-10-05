var mongoose = require('mongoose');
var conf    = require('./config.js').genConf();
var AppUtil = require('./appUtil.js');
var util = require('util');
var _ = require('underscore');
var db = mongoose.connect(conf.mongoDbUri) ; // , conf.mongoDbName);
// var db = mongoose.createConnection(conf.mongoDbUri) ; // , conf.mongoDbName);

// nodejistu:  mongoose.connect('mongodb://nodejitsu:e052b67bd8b033100b92965756b1d4b8@alex.mongohq.com:10087/nodejitsudb148589429036');

var Types = mongoose.Schema.Types;

exports.closeConnection = function() {db.disconnect();}
var roleTypes = ['basic', 'admin'];
var userSchema = new mongoose.Schema(
    { name              : String 
    , email             : { type: String, required: true}
    , roles             : [ {type: String, enum: roleTypes} ] 
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
  ret.reportDropboxAddr =
    conf.imapFetchUsername + '+' + exports.randomString(8) + '@' + conf.statementAddressHost;
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

securitySchema.virtual('desc').get(function() {
  switch (this.securityType) {
    case 'stock': return 'Common Equity';
    case 'option': return 'Option: ' + this.strike + ' ' + this.putCall + ' exp: ' + this.expDt;
    case 'future': return 'Future';
    
  }
  return 'unsupported security type';
});

var fillSchema = new mongoose.Schema(
    { owner   : {type: Types.ObjectId, ref: 'User'}
    , date    : {type: Date, required: true}
    , qty     : {type: Number, required: true}
    , avgPx   : {type: Number, required: true}
    , fees    : Number // should generally be a negative number so we can add everything
    , symbol  : {type: String, required: true}
    , isOpen  : String
    , acctId  : String
    });

fillSchema.virtual('netCash').get(function() {
  var mult = (this.symbol.length > 7 ? 100 : 1)
  return ((-1 * this.qty * this.avgPx * mult) + this.fees )
});

var tradeSchema = new mongoose.Schema(
    { owner     : {type: Types.ObjectId, ref: 'User', required: true}
    , symbol    : {type: String, required: true}
    , fills     : [fillSchema]
    , isOpen    : Boolean
    , acctId    : String
    , mailRef   : {type: Types.ObjectId, ref: 'MailArchive'}
    , uploadRef : {type: Types.ObjectId, ref: 'Upload'} 
    , security  : {type: Types.ObjectId, ref: 'Security'}
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

var authCodeSchema = new mongoose.Schema(
    { value         : String
    , roleGiven     : {type: String, enum: roleTypes}
    });

var AuthCode = db.model('AuthCode', authCodeSchema);
exports.AuthCode = AuthCode;
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

exports.sortByField = sortByField ; 
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

