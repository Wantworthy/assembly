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

  var options = utile.mixin({}, compileOpts, {filename: file});

  try {
    cb(null, coffescript.compile(data, options));
  } catch(err) {
    cb(new Error("Error compiling coffeescript: " + data + ", " + err));
  }
};

exports.attach = function (options) {
  var worker = this.worker;

  compileOpts = utile.mixin({}, defaultConfig, options);
  worker.registerCompiler(".coffee", module.exports);
};