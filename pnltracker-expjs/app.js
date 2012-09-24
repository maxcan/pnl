/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, userRoutes = require('./routes/user')
, tradeRoutes = require('./routes/trade')
, http = require('http')
, util = require('util')
, everyauth = require('everyauth')
, path = require('path')
, Models = require('./models')
, fetcher = require('./lib/statement_fetcher')
, conf    = require('./config.js').genConf()
;

var app = express();

everyauth.google
.appId(conf.oauthGoogleAppId)
.appSecret(conf.oauthGoogleAppSecret)
.scope('https://www.googleapis.com/auth/userinfo.email') // What you want access to
// .handleAuthCallbackError( function (req, res) {
  // If a user denies your app, Google will redirect the user to
  // /auth/google/callback?error=access_denied
  // This configurable route handler defines how you want to respond to
  // that.
  // If you do not configure this, everyauth renders a default fallback
  // view notifying the user that their authentication failed and why.
// })
.findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
  var promise = this.Promise();
  var newUserCb = function(err,newUsr) {
    if (err) throw err;
    promise.fulfill(newUsr);
  };
  Models.User.findOne({email:googleUserMetadata.email}, function(err,usr) {
    if (err) throw err;
    if (usr) {
      newUserCb(null, usr);
    } else {
      console.log('new user, will create');  // _DEBUG
      Models.User.create(Models.newUser( { email: googleUserMetadata.email}), newUserCb);
    }
  });
  return promise;
  // find or create user logic goes here
  // Return a user or Promise that promises a user
  // Promises are created via
  //     var promise = this.Promise();
})
.redirectPath('/');


everyauth.facebook
.appId(conf.oauthFacebookAppId)
.appSecret(conf.oauthFacebookAppSecret)
.scope('email')                        // Defaults to undefined
.fields('id,name,email,picture')       // Controls the returned fields. Defaults to undefined

// .handleAuthCallbackError( function (req, res) {
  // If a user denies your app, Facebook will redirect the user to
  // /auth/facebook/callback?error_reason=user_denied&error=access_denied&error_description=The+user+denied+your+request.
  // This configurable route handler defines how you want to respond to
  // that.
  // If you do not configure this, everyauth renders a default fallback
  // view notifying the user that their authentication failed and why.
// })
.findOrCreateUser( function (session, accessToken, accessTokExtra, fbUserMetadata) {
  console.log('fb meta: ' +  JSON.stringify(fbUserMetadata));  // _DEBUG
  var promise = this.Promise();
  var newUserCb = function(err,newUsr) {
    if (err) throw err;
    promise.fulfill(newUsr);
  };
  Models.User.findOne({email:fbUserMetadata.email}, function(err,usr) {
    if (err) throw err;
    if (usr) {
      newUserCb(null, usr);
    } else {
      console.log('new user, will create');  // _DEBUG
      Models.User.create(Models.newUser({ email: fbUserMetadata.email}), newUserCb);
    }
  });
  return promise;
  // find or create user logic goes here
})
.redirectPath('/');




everyauth.everymodule.userPkey('_id');
everyauth.everymodule.findUserById( function (userId, callback) {
  Models.User.findById(userId, function(err,u) {
    if (err) throw err;
    callback(err,u);
  });
});

app.configure(function(){
  app.set('port', conf.port);
  app.set('host', conf.host);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'blalblsdfsdf'}));
  app.use(express.bodyParser());
  app.use(everyauth.middleware());
  // app.use(function(req,res,next) {
  //   console.log('about to print debug stuff');  // _DEBUG
  //   try {
  //     //console.log('cookies:  ' + JSON.stringify(req.cookies));  // _DEBUG
  //     console.log('session:  ' + util.inspect(req.session, false, null, true));  // _DEBUG
  //     //console.log('signed cookies:  ' + JSON.stringify(req.signedCookies));  // _DEBUG
  //   } catch (e) {
  //     console.log('excepitn: ' + e);  // _DEBUG
  //   }
  //   next();
  // });

  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(require('less-middleware')({
            dest: __dirname + '/public/gen',
            src: __dirname + '/assets/less',
            compress: true
        }));
  app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', userRoutes.list);
app.get('/test/users/ld', userRoutes.loadDummyTrades);
app.get('/test/users/set', userRoutes.setDummyUser);
app.get('/api/user', userRoutes.show);
app.get('/api/trades', tradeRoutes.list);



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
  var mailInterval = 1000 * 10; // 30 sec
  console.log('Starting mail fetcher with interval: ' + mailInterval);  // _DEBUG
  setInterval(fetcher.checkMail, mailInterval);
});
