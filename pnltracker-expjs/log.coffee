winston = require('winston')


logger = new (winston.Logger)({
  transports:
    [ new (winston.transports.Console)()
    , new (winston.transports.File)({ filename: '/tmp/pnl.log' })
    ]
  })

exports.info = logger.info
exports.warn = logger.warn
exports.error = logger.error
exports.log = logger.log

