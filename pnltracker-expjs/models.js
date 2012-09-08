var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'test');
exports.closeConnection = function() {db.close();}
var userSchema = new mongoose.Schema(
    { name: 'string' 
    , email: 'string'
    });

var FillSchema = new mongoose.Schema(
    { owner   : 'ObjectId'
    , date    : 'Date'
    , qty     : 'Number'
    , avgPx   : 'Number'
    , fees    : 'Number'
    
    });

var TradeSchema = new mongoose.Schema(
    { owner     : 'ObjectId'
    , symbol    : 'String'
    , openDate  : 'Date'
    , fills     : [FillSchema]
    });


exports.User = db.model('User', userSchema);

////////////////////////////////////////////////////////////////////////////////
// Trade Grouping 
////////////////////////////////////////////////////////////////////////////////

exports.sortByField = function sortByField(ls, fldName) {
  function cmp(a,b) { 
    if (a[fldName] < b[fldName]) return -1;
    if (a[fldName] > b[fldName]) return 1;
    return 0;
  }
  return ls.sort(cmp);
}
