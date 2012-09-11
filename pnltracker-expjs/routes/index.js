
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.secure = function(req, res) {
    console.log('user: ' +  req.user);  // _DEBUG
  res.render('index', {title: 'hi there'}); } ;
