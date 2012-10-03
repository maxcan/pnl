var conf    = require('../config').genConf();

/*
 * GET home page.
 */

exports.index = function(req, res){
  var loggedIn = req.user;
  if (req.user) return res.redirect('/secure/app');
  return res.render('index', { isDev: conf.isDev, user: req.user, title: 'Express' });
};

exports.secure = function(req, res) {
  console.log('user: ' +  req.user);  // _DEBUG
  res.render('index', { isDev: conf.isDev, user: req.user,title: 'hi there'}); 
} ;
