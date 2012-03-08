var utile = require('utile'),
    async = utile.async,
    path = require('path'),
    fs = require('fs'),
    less;

var defaultConfig = {
  compress: false,
  yuicompress: false,
  optimization: 1,
  silent: false,
  paths: [],
  color: true
};

function loadLessLib() {
  try {
    less = less || require('less');
    return less;
  } catch(e) {
    console.warn('assembly.compilers.less requires the `less` module from npm');
    console.warn('install using `npm install less`.');
    console.trace();
    process.exit(1);
  }
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
      less = loadLessLib(),
      parser = self.parser(filename);

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

LessCompiler.prototype.importedBy = function(filename, callback) {
  var self = this;
  var finder = require('findit').find(this.core.cssRoot);

  var files = [];

  var q = async.queue(function (file, callback) {
    self.imports(file, function(err, importedFiles) {
      if(err) return callback(err);

      if(importedFiles.indexOf(filename) != -1) files.push(file);

      callback();
    });
  }, 5);

  q.drain = function() {
    callback(null, files);
  };

  finder.on('file', function (file, stat) {
    q.push(file, console.log); 
  });
};

LessCompiler.prototype.imports = function(filename, callback) {
  if(path.extname(filename) != ".less") return callback(null, []);

  var self = this,
      less = loadLessLib(),
      parser = self.parser(filename);
  
  fs.readFile(filename, 'utf8', function(err, data) {
    if(err) return callback(err);

    parser.parse(data, function (err, tree) {
      if(err) return callback(err);

      var imports = Object.keys(parser.imports.files);
      var importedFiles = imports.map(function(f){
        return path.join(path.dirname(filename), f);
      });

      callback(null, importedFiles);
    });
  });
};

LessCompiler.prototype.parser = function(filename) {
  var self = this,
      less = loadLessLib(),
      paths = [path.dirname(filename)].concat(this.options.paths),
      options = utile.mixin({}, this.options, {paths : paths, filename: filename});

  return new(less.Parser)(options);
};