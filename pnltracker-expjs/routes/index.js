
/*
 * GET home page.
 */

exports.index = function(req, res){
  var loggedIn = req.user;
  res.render('index', { user: req.user, title: 'Express' });
};

exports.secure = function(req, res) {
    console.log('user: ' +  req.user);  // _DEBUG
  res.render('index', { user: req.user,title: 'hi there'}); } ;
