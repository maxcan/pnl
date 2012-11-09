conf    = require('../config.js').genConf()
util    = require('util');
log     = require('../log')
stripe  = require('stripe')(conf.stripeSecretKey)

exports.errNeedStripeToken      = "Needs to create a Stripe Token"
exports.errNeedEmailAddres      = "Needs to have an email address set"
exports.errStripeCustError      = "Error creating stripe customer: "
exports.errStripeSubscibeError  = "Error subscribing: "
exports.errDbSaveError          = "Error saving customer data: "

exports.createAndSubscribeCustomer = (user, redemptionCode, callback) ->
  return callback(exports.errNeedStripeToken) unless user.stripeToken?
  return callback(exports.errNeedEmailAddres) unless user.email?
  if not user.stripeCustomerId
    return stripe.customers.create email: user.email, (err, stripeCust) ->
      if err?
        log.error "Error #{util.inspect err} creating stripe customer for user #{user._id}"
        return callback("#{exports.errStripeCustError} #{err}")
      user.stripeCustomerId = stripeCust.id
      return user.save (saveErr) ->
        if saveErr?
          log.error "Error #{util.inspect saveErr} saving stripe customer id for #{user._id}"
          return callback("#{exports.errDbSaveError} #{err}")
        return subscribeCustomer(user, redemptionCode, callback)
  return subscribeCustomer(user, redemptionCode, callback)

subscribeCustomer = (user, redemptionCode, callback) ->
  subscrArgs = plan: conf.stripePlanId
  if (redemptionCode?)
    subscrArgs.coupon =  redemptionCode

  stripe.customers.update_subscription user.stripeCustomerId, subscrArgs, (err, subscription) ->
    if err?
      log.error "Error #{util.inspect(err)} creating stripe customer for user #{user._id}"
      return callback("#{exports.errStripeSubscibeError} #{err}")
    return callback(null, subscription)

