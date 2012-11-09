var crypto = require('crypto');
var mongoose = require('mongoose');
var dateFormat = require('dateformat');
var conf    = require('./config.js').genConf();
var AppUtil = require('./appUtil.js');
var util = require('util');
var _ = require('underscore');
var db = mongoose.connect(conf.mongoDbUri) ; // , conf.mongoDbName);

var Types = mongoose.Schema.Types;

exports.closeConnection = function() {db.disconnect();}
var roleTypes = ['basic', 'admin'];
var accountStatuses = ['paid', 'problem'];
var userSchema = new mongoose.Schema(
    { name              : String 
    , email             : { type: String, required: true}
    , roles             : [ {type: String, enum: roleTypes} ] 
    , openId            : String
    , openIdProfile     : String
    , reportDropboxAddr : [String]
    , accountStatus     : { type: String, enum: accountStatuses}
    , stripeToken       : String
    , stripeCustomerId  : String
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
    , desc          : String
    , securityType  : {type: String , enum: securityTypes}
    , expDt         : Date
    , strike        : Number
    , multiplier    : {type: Number, default: 1, min: 1 }
    , putCall       : {type: String, enum: ['P','C']}
    , underlying    : {type: Types.ObjectId, ref: 'Security'}
    });

securitySchema.pre('save', function(next) {
  var security = this;
  switch (this.securityType) {
    case 'stock': 
      security.desc = security.symbol + ' Equity';
      return (next());
    case 'option': 
      return exports.Security.findById(security.underlying, function(err, undl) {
        if (err) {
          console.log('error generating symbol desc:' + err);
          return next(err);
        }
        if (!undl) {
          console.log('missing underling for symbol ' + security._id);
          return next('missing underlying for security: ' + security._id);
        }


        var dtStr = dateFormat(this.expDt, 'yyyy-mm-dd');
        security.desc = undl.symbol + ' ' + security.putCall +  security.strike + ' ' + dtStr;
        return next();
      });
    case 'future':
      return exports.Security.findById(security.underlying, function(err, undl) {
        if (err) {
          console.log('error generating symbol desc:' + err);
          return next(err);
        }
        var dtStr = dateFormat(this.expDt, 'yyyy-mm-dd');
        security.desc = undl.symbol + ' FUTURE ' + dtStr;
        return next();
      });
  }

});

// securitySchema.virtual('desc').get(function() {
//   switch (this.securityType) {
//     case 'stock': return 'Common Equity';
//     case 'option': 
//       var dtStr = dateFormat(this.expDt, 'yyyy-mm-dd');
//       return 'Option: ' + this.strike + ' ' + this.putCall + ' exp: ' + dtStr;
//     case 'future': return 'Future';
//     
//   }
//   return 'unsupported security type';
// });

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
    , reportRef : {type: Types.ObjectId, ref: 'BrokerReport'} 
    , security  : {type: Types.ObjectId, ref: 'Security'}
    , notes     : String
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
  var mult = (this.symbol.length > 7 ? 100 : 1)
  return mult * (this.fills[0].qty > 0 
                ? this.totalBuy  * this.vwapBuy
                : Math.abs(this.totalSell * this.vwapSell ));
});

var brokerReportSchema = new mongoose.Schema(
    { owner         : {type: Types.ObjectId, ref: 'User'}
    , uploadMethod  : {type: String, enum: ['email','uploadText','upload']}
    , fileName      : String
    , processed     : Boolean
    , mimeType      : String
    , content       : Buffer
    , extractedText : [String]
    , mailRef       : {type: Types.ObjectId, ref: 'MailArchive'}
    , receivedDate  : Date
    , senderIp      : String
    , md5Hash       : String
    });

brokerReportSchema.pre('save', function(next) {
  var report = this;
  var md5sum = crypto.createHash('md5');
  if (report.content) { 
    md5sum.update(report.content);
  } else {
    md5sum.update(report.extractedText.join('\n'));
  }
  report.md5Hash = md5sum.digest('base64');
  return next();
});

var mailArchiveSchema = new mongoose.Schema(
    { owner         : {type: Types.ObjectId, ref: 'User'}
    , to            : [String]
    , from          : String
    , subject       : String
    , raw           : String
    , receivedDate  : Date
    , mailDate      : Date
    , seqno         : Number
    , uid           : Number
    , attachments   : [{type: Types.ObjectId, ref: 'BrokerReport'}]
    , dupedAttachements       : [{type: Types.ObjectId, ref: 'BrokerReport'}]
    , unprocessedAttachments  : [{type: Types.ObjectId, ref: 'BrokerReport'}]
    , hasError      : {type: Boolean, default: false}
    });

var authCodeSchema = new mongoose.Schema(
    { value         : String
    , roleGiven     : {type: String, enum: roleTypes}
    });

var AuthCode = db.model('AuthCode', authCodeSchema);
exports.AuthCode = AuthCode;
var User  = db.model('User', userSchema);
exports.User = User;
var MailArchive  = db.model('User', mailArchiveSchema);
exports.MailArchive = MailArchive;
var Fill = db.model('Fill', fillSchema);
exports.Fill = Fill;
var Trade = db.model('Trade', tradeSchema);
exports.Trade = Trade;
var Security = db.model('Security', securitySchema);
exports.Security = Security;
var BrokerReport = db.model('BrokerReport', brokerReportSchema);
exports.BrokerReport = BrokerReport;
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

