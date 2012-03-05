var uglify = require("uglify-js");

exports.mimeType = "application/javascript";

exports.attach = function (options) {
  var manager = this;

  var minify = new Minify(manager.core, options);
  manager.worker.registerProcessor(exports.mimeType, minify);
};

var Minify = exports.Minify = function(core, options) {
  this.core = core;
  this.options = options;
};

Minify.prototype.process = function(filename, src) {
  return uglify(src, this.options);
};
