
/*
 * GET home page.
 */

exports.index = function(req, res){
  var loggedIn = req.user;
    // console.log('cookies:  ' + JSON.stringify(req.cookies));  // _DEBUG
    // console.log('signed cookies:  ' + JSON.stringify(req.signedCookies));  // _DEBUG
  res.render('index', { user: req.user, title: 'Express' });
};

exports.secure = function(req, res) {
    console.log('user: ' +  req.user);  // _DEBUG
  res.render('index', { user: req.user,title: 'hi there'}); } ;
