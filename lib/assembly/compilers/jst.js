var utile = require('utile'),
    compileOpts = {};

exports.name = "underscore template compiler";
exports.mimeType = "application/javascript";

exports.compile = function(file, data, cb) {
  var _ = require('underscore');
  
  try {
    var output = [];
    output.push('var underscore = require("underscore");');
    output.push('module.exports = underscore.template(' + JSON.stringify(data) + ');' );

    cb(null, output.join("\n"));
  } catch(err) {
    cb(new Error("Error compiling jst: " + data + ", " + err.message));
  }
};

exports.attach = function (options) {
  var worker = this.worker;

  compileOpts = utile.mixin({}, options);

  worker.registerCompiler(".jst", module.exports);
};