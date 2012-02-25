var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    watch = require('watch'),
    findit = require('findit'),
    assembly = require("../assembly"),
    mime = require('mime'),
    broadway = require('broadway'),
    detective = require('detective'),
    resolver = require('resolve'),
    async = utile.async;

var Manager = exports.Manager = function (options) {  
  this.src = options.src;
  this.dest = options.dest;
  this.watch = options.watch === undefined ? true : options.watch;
  this.worker = new assembly.Worker();

  var self = this;

  broadway.App.call(this);

  this.use(broadway.plugins.log);

  utile.each(assembly.compilers, function(comp) {
    self.use(comp);
  });

  this.on("compile", function(src) {
    self.compileAndWrite(src, function(err) {
      if(err) self.log.warn("error compiling " + src + err);
    });
  });

  this.on("write", this.write);

  if(this.watch) this.startMonitor();
};

utile.inherits(Manager, broadway.App);

Manager.prototype.startMonitor = function() {
  var self = this;
  
  watch.createMonitor(self.src, function (monitor) {
    self.monitor = monitor;
    
    monitor.on("changed", self.compileAndWrite.bind(self));
    monitor.on("created", self.compileAndWrite.bind(self));
    monitor.on("removed", self.remove);
  });
};

Manager.prototype.compileAndWrite = function(src, cb) {
  var self = this;
  
  this.callIfModified(src, function() {
    self.worker.compile(src, function(err, data) {
      if(err) return cb(err);

      self.requires(data).forEach(function(file){
        self.emit("compile", file);
      });

      self.emit("write", src, data, cb);
    });
  });
};

// returns all required files for given src
Manager.prototype.requires = function(src) {
  var self = this;

  return detective(src).map(function(r) {
    try {
      return resolver.sync(r, {basedir : self.src, extensions : [".js", ".coffee"] });
    } catch(ex){return null}
  }).filter(Boolean);
};

Manager.prototype.callIfModified = function(src, cb){
  var self = this;

  async.parallel({
      srcStats: async.apply(fs.stat, src),
      destStats: async.apply(fs.stat, this._destFile(src))
    },
    function(err, results) {
      if(err) return cb.call(self); // invoke empty callback if error happened

      if(results.srcStats.mtime > results.destStats.mtime) {
        return cb.call(self);
      }
    }
  );
};

Manager.prototype.write = function(srcFile, data, cb) {
  if (!cb || typeof cb != 'function') {
    cb = function(){};
  }

  var self = this;
  var outputFile = this._destFile(srcFile);

  utile.mkdirp(path.dirname(outputFile), function(err){
    if(err) return cb(err);

    self.log.info("compiling " + srcFile + " to " + outputFile);
    fs.writeFile(outputFile, data, cb);
  });
};

Manager.prototype.remove = function(file) {
  var self = this;

  var delFile = this._destFile(file);
  fs.unlink(delFile, function (err) {
    if (err) return;
    
    self.log.info('deleted file ' + delFile);
  });
};

Manager.prototype.rebuild = function() {
  var self = this;

  utile.rimraf(this.dest, function(){
    var finder = findit.find(self.src);
    finder.on('file', self.compileAndWrite.bind(self));
  });
};

Manager.prototype._destFile = function(filePath) {
  var fileExtension = path.extname(filePath);
  var mimeType = mime.lookup(fileExtension);

  var destPath = path.join(this.dest, filePath.slice(this.src.length));
  if(filePath.match(/node_modules/)) {
    destPath = path.join(this.dest, "vendor", filePath.replace(/^.*\/node_modules/, ""));
  }

  var newFileName = path.basename(filePath, fileExtension) + "." + mime.extension(mimeType);

  return path.join(path.dirname(destPath), newFileName);
};