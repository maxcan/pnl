
/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.show = function(req, res) {
  if (!req.user) {res.send(403, "authentication required");}
  res.send(req.user);
};
