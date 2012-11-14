var _ = require('underscore');

var baseSettings = 
  { host: 'dev.tradejitsu.com'
  , port: 3000
  , trialPeriodDays: 21
  , allowNonSsl: false
  , isDev: false
  , logPath: '/tmp/pnl.dev.log'
  // oauth stuff
  , oauthGoogleAppId : '903799978070.apps.googleusercontent.com'
  , oauthGoogleAppSecret : 'aUfnPV75qEtNjrhEaczfJu__'
  , oauthFacebookAppId  : '426843550684294'
  , oauthFacebookAppSecret : '15c7515203b6536d932187ff9949470d'

  // mongoose
  , mongoDbName: 'test'
  , mongoDbSessionName: 'sessions'
  , mongoDbUri: 'mongodb://localhost/test'

  // statement fetching:
  , statementAddressHost: 'tradejitsu.com'
  , imapFetchUsername: 'u_dev'
  , imapFetchPassword: 'bjhekd2343'
  , imapFetchHost: 'imap.gmail.com'
  , imapFetchPort: 993
  // stripe
  , stripeSecretKey: 'H7WIg3WsoWZSZLaRBQRkL3hSZVUMpzBr'
  , stripePublishableKey: 'pk_IOA1hVJCHQwtyBoz53xeI9W4YHa8n'
  , stripePlanId: 'tradejitsu_dev'
  } ;

var prdSettings = _.extend(_.clone(baseSettings), 
      {host: 'tradejitsu.com'
      , port: 80
      , listenPort: 2000
      , imapFetchPassword: 'h09823e49bje9'
      , logPath: '/home/prd/pnl.log'
      , imapFetchUsername: 'u'
      , mongoDbName: 'pnltracker_prd'
      , mongoDbUri: 'mongodb://localhost/pnltracker_prd'
      , stripeSecretKey: '2ndHk8DBLiETnOM9MnpjymCdj1CTTUPf'
      , stripePublishableKey: 'pk_XjdJwhY6TxzE8Box3BlfPWLmFFWBg'
      , oauthFacebookAppId  : '370329279725161'
      , oauthFacebookAppSecret : '61e81563bf4299f417ea89cd2d1cba4f'
      , oauthGoogleAppId : '745594005809.apps.googleusercontent.com'
      , oauthGoogleAppSecret : '9uxt8UxAU4tzOUAuGtAjA7Y0'
      }) ;
  
var stgSettings = _.extend(_.clone(baseSettings), 
      { host: 'staging.tradejitsu.com'
      , port: 80
      , listenPort: 3000
      , imapFetchPassword: 'xcmnvbvg234rhkj'
      , imapFetchUsername: 'u_stg'
      , logPath: '/home/stg/pnl.log'
      , mongoDbName: 'pnltracker_stg'
      , mongoDbUri: 'mongodb://localhost/pnltracker_stg'

      // oauth stuff
      , oauthGoogleAppId : '630789708184.apps.googleusercontent.com'
      , oauthGoogleAppSecret : 'Vo4tHhdCGeHajAlFDqBoN7jZ'
      , oauthFacebookAppId  : '459532804091474'
      , oauthFacebookAppSecret : 'c7b00c680d9b02d45f803c6d5b1a86a3'
      });
var devSettings = _.extend(_.clone(baseSettings),
      { isDev: true
      , allowNonSsl: true
      , ignoreAuthCode: true

      });


exports.genConf = function(){
    switch(process.env.NODE_ENV.toLowerCase()){
        case 'dev': return _.clone(devSettings);
        case 'prd': return _.clone(prdSettings);
        case 'stg': return _.clone(stgSettings);
        default: throw new Error("no environment set");
    }
};
