/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, user = require('./routes/user')
, http = require('http')
, everyauth = require('everyauth')
, path = require('path')
, Models = require('./models')
;

var app = express();

everyauth.google
.appId('903799978070.apps.googleusercontent.com')
.appSecret('aUfnPV75qEtNjrhEaczfJu__')
.scope('https://www.googleapis.com/auth/userinfo.email') // What you want access to
.handleAuthCallbackError( function (req, res) {
  // If a user denies your app, Google will redirect the user to
  // /auth/google/callback?error=access_denied
  // This configurable route handler defines how you want to respond to
  // that.
  // If you do not configure this, everyauth renders a default fallback
  // view notifying the user that their authentication failed and why.
})
.findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
  var promise = this.Promise();
  Models.User.find({email:googleUserMetadata.email}, function(err,usr) {
    if (err) throw err;
    if (usr === null || usr == '') {
      Models.User.create( { email: googleUserMetadata.email}
        , function newUserCb(err, newUsr) { 
          if (err) throw err;
          promise.fulfill(newUsr);
          });
    } else { 
      promise.fulfill(usr) ; 
    } 
  });
  return promise;
  // find or create user logic goes here
  // Return a user or Promise that promises a user
  // Promises are created via
  //     var promise = this.Promise();
})
.redirectPath('/');

everyauth.everymodule.userPkey('_id');
everyauth.everymodule.findUserById( function (userId, callback) {
  Models.User.findById(userId, callback);
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('ghrtiughdifuvsghuit4578ye'));
  app.use(express.session());
  app.use(everyauth.middleware());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

var secureStatic = express.static(__dirname+'/private');

app.get('/secure/*', function(req, res) {
  req.url = req.url.replace(/^\/secure/,'');
  if (!req.user) {
    console.log('authenticated user required for secure routes');  // _DEBUG
    res.redirect('/');
  } else {
    secureStatic(req, res, function(){res.send(404);});
  }
  });

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
