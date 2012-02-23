var utile = require('utile'),
    compileOpts = {};

var defaultConfig = {
  bare: false,
  header: false
};

exports.name = "coffeescript compiler";

exports.mimeType = "application/javascript";

exports.compile = function(file, data, cb) {
  var coffescript = require('coffee-script');

  try {
    cb(null, coffescript.compile(data, compileOpts));
  } catch(err) {
    cb(new Error("Error compiling coffeescript: " + data + ", " + err));
  }
};

exports.attach = function (options) {
  var worker = this;

  compileOpts = utile.mixin({}, defaultConfig, options);
  worker.registerCompiler(".coffee", module.exports);
};