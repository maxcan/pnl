var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'test');

var userSchema = new mongoose.Schema(
    { name: 'string' 
    , email: 'string'
    });

var tradeSchema = new mongoose.Schema(
    { owner: 'ObjectId'
    , symbol: 'String'
    , fills: [{date: 'Date', qty: 'Number', avgPx: 'Number', fees: 'Number'}]
    });


exports.User = db.model('User', userSchema);

// var kitty = new Cat({ name: 'Zildjian' });
// kitty.save(function (err) {
//     if (err) // ...
//     res.end('meow');
// });
// 
