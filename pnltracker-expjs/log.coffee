winston = require('winston')
conf    = require('./config.js').genConf()


logger = new (winston.Logger)({
  transports:
    [ new (winston.transports.Console)()
    , new (winston.transports.File)({ filename: conf.logPath })
    ]
  })

exports.info = logger.info
exports.warn = logger.warn
exports.error = logger.error
exports.log = logger.log

