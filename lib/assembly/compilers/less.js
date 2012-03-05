var utile = require('utile'),
    path = require('path'),
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
  
  var paths = [path.dirname(file)].concat(compileOpts.paths);
  var options = utile.mixin({}, compileOpts, {paths : paths, filename: file});

  var parser = new(less.Parser)(options);
  
  parser.parse(data, function (err, tree) {
    if(err) {
      less.writeError(err, options);
      return cb(err);
    }

    try {
      var css = tree.toCSS({compress: compileOpts.compress, yuicompress: compileOpts.yuicompress});
      return cb(null, css);
    } catch(ex) {
      less.writeError(ex, options);
      return cb(ex);
    }
  });
};

exports.attach = function (options) {
  var worker = this.worker;

  compileOpts = utile.mixin({}, defaultConfig, options);

  worker.registerCompiler(".less", module.exports);
};