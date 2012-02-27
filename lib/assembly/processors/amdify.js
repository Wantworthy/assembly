exports.mimeType = "application/javascript";

exports.attach = function (options) {
  var manager = this;

  var amdify = new Amdify();
  manager.registerProcessor(amdify);
};

var Amdify = exports.Amdify = function(options) {

};