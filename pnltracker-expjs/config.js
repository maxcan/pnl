var _ = require('underscore');


var baseSettings = 
  { host: 'dev.pnltracker.com'
  , port: 3000
  , allowNonSsl: false
  , isDev: false
  // oauth stuff
  , oauthGoogleAppId : '903799978070.apps.googleusercontent.com'
  , oauthGoogleAppSecret : 'aUfnPV75qEtNjrhEaczfJu__'
  , oauthFacebookAppId  : '426843550684294'
  , oauthFacebookAppSecret : '15c7515203b6536d932187ff9949470d'

  // mongoose
  , mongoDbName: 'test'
  , mongoDbUri: 'mongodb://localhost/test'

  // statement fetching:
  , statementAddressHost: 'pnltracker.com'
  , imapFetchUsername: 'dropdev'
  , imapFetchPassword: 'xsdf9smh2kv0'
  , imapFetchHost: 'imap.gmail.com'
  , imapFetchPort: 993
  } ;

var prdSettings = {};
var stgSettings = _.extend(_.clone(baseSettings), 
      { host: 'staging.pnltracker.com'
      , port: 80
      , listenPort: 3000
      , imapFetchPassword: 'j3sdf4tlkjdsk'
      , imapFetchUsername: 'dropstg'
      // , mongoDbName: 'pnltracker'
      ////  , mongoDbUri: 'mongodb://nodejitsu:e052b67bd8b033100b92965756b1d4b8@alex.mongohq.com:10087/nodejitsudb148589429036'


      // oauth stuff
      , oauthGoogleAppId : '630789708184.apps.googleusercontent.com'
      , oauthGoogleAppSecret : 'Vo4tHhdCGeHajAlFDqBoN7jZ'
      , oauthFacebookAppId  : '459532804091474'
      , oauthFacebookAppSecret : 'c7b00c680d9b02d45f803c6d5b1a86a3'
      });
var devSettings = _.extend(_.clone(baseSettings),
      { isDev: true
      , allowNonSsl: true

      });


exports.genConf = function(){
    switch(process.env.NODE_ENV.toLowerCase()){
        case 'dev': return _.clone(devSettings);
        case 'prd': return _.clone(prdSettings);
        case 'stg': return _.clone(stgSettings);
        default: throw new Error("no environment set");
    }
};
