var utils = require('../utils'),
    coffescript = utils.load('coffee-script');

exports.name = "coffeescript compiler";

exports.mimeType = "application/javascript";

exports.compile = function(file, data, cb) {
  try {
    cb(null, coffescript.compile(data));
  } catch(err) {
    cb(new Error("Error compiling coffeescript: " + data + ", " + err));
  }
};

exports.attach = function (options) {
  var worker = this;

  worker.registerCompiler(".coffee", module.exports);
};