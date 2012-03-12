var utile = require('utile'),
    async = utile.async,
    path = require('path'),
    fs = require('fs'),
    readDirFiles = require('read-dir-files'),
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
  var manager = this;

  var compiler = new LessCompiler(manager, options);

  manager.worker.registerCompiler(".less", compiler);
};

var LessCompiler = exports.LessCompiler = function (manager, options) {
  this.manager = manager;
  this.core = manager.core;
  this.options = utile.mixin({}, defaultConfig, options);
  this.name = "less compiler";
  this.mimeType = "text/css";
};

LessCompiler.prototype.compile = function(filename, data, callback) {
  var self = this,
      parser = self.parser(filename);

    this.importedBy(filename, function(err, files) {
      if(err) return callback(err);

      if(files.length > 0) { // only compile top level less files
        var err = new Error("Skipping compilation of " + filename);
        err.skipped = true;
        files.forEach(function(f) {
          self.manager.emit("compile", f, {force : true});
        });

        return callback(err);
      } else {
        self._toCSS(parser, data, callback);
      }
    });
};

LessCompiler.prototype._toCSS = function(parser, data, cb) {
  var self = this;

  parser.parse(data, function (err, tree) {    
    if(err) {
      loadLessLib().writeError(err, self.options);
      return cb(err);
    }

    try {
      var css = tree.toCSS({compress: self.options.compress, yuicompress: self.options.yuicompress});
      return cb(null, css);
    } catch(ex) {
      loadLessLib().writeError(ex, self.options);
      return cb(ex);
    }
  });
};

LessCompiler.prototype.importedBy = function(filename, callback) {
  var self = this;

  var files = [];
  var fileSearchEnded = false;

  var q = async.queue(function (file, callback) {
    self.imports(file, function(err, importedFiles) {
      if(err) return callback(err);

      if(importedFiles.indexOf(filename) != -1) files.push(file);

      callback();
    });
  }, 2);

  q.drain = function() {
    if(fileSearchEnded) return callback(null, files);
  };

  readDirFiles.list(self.core.cssRoot)
    .on('file', q.push)
    .on('end', function(){fileSearchEnded = true});
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