/**
 * Module dependencies.
 */

require("coffee-script") ; 
var express = require('express'); 
var routes = require('./routes');
var userRoutes = require('./routes/user');
var mailRoutes = require('./routes/mail');
var tradeRoutes = require('./routes/trade');
var adminRoutes = require('./routes/admin');
var http = require('http');
var less = require('less');
var fs = require('fs');
var log = require('./log')
var util = require('util');
var everyauth = require('everyauth');
var path = require('path');
var Models = require('./models');
var fetcher = require('./lib/statement_fetcher');
var conf    = require('./config.js').genConf();
var _ = require('underscore');
var MongoStore = require('connect-mongo')(express);
var app = express();

log.info('Using config: ' + util.inspect(conf, false, null, true));

everyauth.google
.appId(conf.oauthGoogleAppId)
.appSecret(conf.oauthGoogleAppSecret)
.authQueryParam({ access_type:'online', approval_prompt:'auto' })

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
      log.info('new user, will create');  // _DEBUG
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
  log.info('fb meta: ' +  JSON.stringify(fbUserMetadata));  // _DEBUG
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
      log.info('new user, will create');  // _DEBUG
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

var bodyParserWithFiles = new express.bodyParser({ keepExtensions: true, uploadDir: __dirname + "/tmp/" });
// var bodyParserNoFiles = new express.bodyParser();
// bodyParserNoFiles.parse['multipart/form-data'] = function(a, b, next) { next(); }

var annoyingProxyTrackerShit = function (req, res, next) {
    if (req.path.indexOf('/proxy') === 0) {
        log.info('Annoying proxy shit.  IP = ' + req.ip);
        return res.send(410, 'go away');
    }
    return next();
} ;
var checkSsl = function(req, res, next) {
    if (conf.allowNonSsl || req.path === '/ping') {
      return next();
    }
    if (req.headers["x-forwarded-proto"] === "https"){ return next(); }
    return res.redirect(301, "https://" + conf.host + req.url);  
} ; 

var requireRole = function (pat, role) {
  return function(req, res, next) {
    if (!req.path.match(pat)) return next();
    if (!req.user) return res.send(401);
    if (_.indexOf(req.user.roles, role) != -1) {
      return next();
    } else {
      return res.send(401);
    }
  };
} ; 

log.info('about to generate less files');  // _DEBUG
try {
  fs.readFile(__dirname + '/assets/less/application.less',function(error,data){
    if (error) {
      log.info('error rendering css: ' + error);  
      throw error;
    } else { 
      data = data.toString();
      log.info('read in data, about to generate the css');  // _DEBUG
      less.render(data, function (e, css) {
        fs.writeFile(__dirname + '/public/gen/application.css', css, function(err){
          if (err) {
            log.info('error saving css: ' + err);
          }
          log.info('RENDERED less');
        });
      });
    }
  });
} catch (e) {
  log.info('error generating less : ' + e );
}
log.info('generated less files');  // _DEBUG


app.configure(function(){
  app.set('port', conf.port);
  app.set('host', conf.host);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  // app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(annoyingProxyTrackerShit);
  app.use(checkSsl);
  app.use(express.session(
      { secret: 'blalblsdfsdf'
      , store:  new MongoStore({url: conf.mongoDbUri + '/' + conf.mongoDbSessionName})
      }));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(everyauth.middleware());

  //  app.use(require('less-middleware')({
  //            dest: __dirname + '/public/gen/',
  //            prefix: 'gen', 
  //            debug: true,
  //            src: __dirname + '/assets/less/',
  //        }));

  app.use(requireRole(/.*admin.*/, 'admin'));
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/' ,                       routes.index);
app.get('/ping',                    function(req,res) { return res.send(200, 'pong'); });
app.get('/terms',                   function(req,res) { return res.render('terms', {title:'Tradejitsu Terms'}); });
app.get('/privacy',                 function(req,res) { return res.render('privacy', {title:'Tradejitsu Privacy Statement'}); });
app.get('/users',                   userRoutes.list);
app.get('/test/62580/users/ld',     userRoutes.loadDummyTrades);
app.get('/test/users/set',          userRoutes.setDummyUser);
app.get('/api/user',                userRoutes.show);
app.post('/api/user/authcode',      userRoutes.setAuthCode);
app.post('/api/user/stripe-token',  userRoutes.setStripeToken);
app.post('/api/user/check-coupon',  userRoutes.checkCoupon);
app.post('/api/user/note',          userRoutes.setNote);
app.get('/api/user/notes',           userRoutes.getNote);

app.get('/api/trades',              tradeRoutes.list);
app.get('/api/mails',               mailRoutes.list);

app.post('/api/report/upload', bodyParserWithFiles, tradeRoutes.reportUpload);
app.get('/api/report/get/:uploadId', tradeRoutes.getUpload);
app.post('/api/report/setText/:uploadId', tradeRoutes.setReportText);
app.post('/api/report/setNotes/:tradeId', tradeRoutes.setNotes);

app.get('/api/admin/users',             adminRoutes.usersList);
app.get('/api/admin/setuser/:userId',   adminRoutes.setUser);
app.get('/api/admin/trades',            adminRoutes.tradesList);
app.get('/api/admin/uploads',           adminRoutes.uploadsList);
app.get('/api/admin/mails',             adminRoutes.mailsList);
app.get('/api/admin/authcodes',         adminRoutes.authCodesList);
app.post('/api/admin/authcode',         adminRoutes.genAuthCode);
app.post('/api/admin/clean-db',         adminRoutes.cleanDb);
app.get('/api/admin/report/:reportId',  adminRoutes.getReport);


var secureStatic = express.static(__dirname+'/private');

app.get('/secure/*', function(req, res) {
  req.url = req.url.replace(/^\/secure/,'');
  if (!req.user) {
    log.info('authenticated user required for secure routes');  // _DEBUG
    res.redirect('/');
  } else {
    secureStatic(req, res, function(){res.send(404);});
  }
  });

// when behind a reverse proxy, we will often want to use a different port
// for URL generation from what we are actually listening on
var listenPort = (conf.listenPort ? conf.listenPort : app.get('port'));

http.createServer(app).listen(listenPort, function(){
  log.info("Express server listening on port " + listenPort);
  log.info("     However, app port is :" + app.get('port'));
  var mailInterval = 1000 * 10; // 30 sec
  function wrapCheckMail() {
    try {
      fetcher.checkMail();
    } catch (e) {
      log.info('ERROR COULD NOT CHECK MAIL: ' + e.stack); // _TODO email an admin here
    }
  }
  log.warn('NOT checking mail');
  //  log.info('Starting mail fetcher with interval: ' + mailInterval);  // _DEBUG
 //  setInterval(wrapCheckMail, mailInterval);
});
