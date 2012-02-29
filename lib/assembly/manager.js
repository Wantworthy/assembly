var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    findit = require('findit'),
    assembly = require("../assembly"),
    broadway = require('broadway'),
    mime = require('mime'),
    async = utile.async;

var Manager = exports.Manager = function (options) {  
  this.src = options.src;
  this.dest = options.dest;
  this.watch = options.watch === undefined ? true : options.watch;
  this.cache = options.cache === undefined ? true : options.cache;

  this.core = new assembly.Core({src : this.src, dest: this.dest, cache: this.cache});
  this.worker = new assembly.Worker();

  var self = this;

  broadway.App.call(this);

  this.use(broadway.plugins.log, {console: {colorize : true}});

  utile.each(assembly.compilers, function(comp) {
    self.use(comp);
  });

  this.on("compile", function(src) {
    self.compileAndWrite(src, function(err) {
      if(err) self.log.error("error compiling " + src + err);
    });
  });

  this.on("write", this.write);
  this.on("remove", this.remove);

  if(this.watch) {
    self.use(assembly.plugins.watcher);
  }
};

utile.inherits(Manager, broadway.App);

Manager.prototype.compileAndWrite = function(filename, cb) {
  var self = this;
  
  this.core.modified(filename, function(modified) {
    if(!modified) return cb();

    self.worker.compile(filename, function(err, compiledSource) {
      if(err) return cb(err);

      if(mime.lookup(filename) === mime.types.js) {
        self.core.requires(compiledSource).forEach(function(file){
          self.emit("compile", file);
        });
      }

      self.worker.process(filename, compiledSource, function(err, data) {
        self.emit("write", filename, data, cb);
      });
    });
  });
};

Manager.prototype.write = function(srcFile, data, cb) {
  if (!cb || typeof cb != 'function') {
    cb = function(){};
  }

  var self = this;
  var outputFile = this.core.buildPath(srcFile, {fullpath : true});

  utile.mkdirp(path.dirname(outputFile), function(err){
    if(err) return cb(err);

    self.log.info("compiling " + srcFile + " to " + outputFile);
    fs.writeFile(outputFile, data, cb);
  });
};

Manager.prototype.remove = function(file) {
  var self = this;

  var delFile = this.core.buildPath(file, {fullpath : true});
  fs.unlink(delFile, function (err) {
    if (err) return;
    
    self.log.info('deleted file ' + delFile);
  });
};

Manager.prototype.rebuild = function() {
  var self = this;

  var emit = self.emit.bind(self);
  utile.rimraf(this.dest, function() {
    var finder = findit.find(self.src);
    finder.on('file', async.apply(emit, 'compile'));
  });
};