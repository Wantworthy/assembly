var utile = require('utile'),
    path = require('path');

var defaultConfig = {
  compress: false,
  yuicompress: false,
  optimization: 1,
  silent: false,
  paths: [],
  color: true
};

exports.attach = function (options) {
  var worker = this.worker;

  var compiler = new LessCompiler(this.core, options);

  worker.registerCompiler(".less", compiler);
};

var LessCompiler = exports.LessCompiler = function (core, options) {
  this.core = core;
  this.options = utile.mixin({}, defaultConfig, options);
  this.name = "less compiler";
  this.mimeType = "text/css";
};

LessCompiler.prototype.compile = function(filename, data, cb) {
  var self = this,
      less = require('less'),
      paths = [path.dirname(filename)].concat(this.options.paths),
      options = utile.mixin({}, this.options, {paths : paths, filename: filename});

  var parser = new(less.Parser)(options);

  parser.parse(data, function (err, tree) {
    console.log(Object.keys(parser.imports.files));
    
    if(err) {
      less.writeError(err, options);
      return cb(err);
    }

    try {
      var css = tree.toCSS({compress: self.options.compress, yuicompress: self.options.yuicompress});
      return cb(null, css);
    } catch(ex) {
      less.writeError(ex, options);
      return cb(ex);
    }
  });
};