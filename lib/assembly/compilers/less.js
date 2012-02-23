var utile = require('utile'),
    compileOpts = {};

var defaultConfig = {
  compress: false,
  yuicompress: false,
  optimization: 1,
  silent: false,
  paths: [],
  color: true
};

exports.name = "less compiler";

exports.mimeType = "text/css";

var compile = exports.compile = function(file, data, cb) {
  var less = require('less');
  var parser = new(less.Parser)({optimization: compileOpts.optimization, filename: file});
  
  try {
    parser.parse(data, function (err, tree) {
      if(err) return cb(err);

      css = tree.toCSS({compress: compileOpts.compress, yuicompress: compileOpts.yuicompress});
      cb(null, css);
    });
  } catch(e) {
    cb(e);
  }
};

exports.attach = function (options) {
  var worker = this;

  compileOpts = utile.mixin({}, defaultConfig, options);

  worker.registerCompiler(".less", module.exports);
};