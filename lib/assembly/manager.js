var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    watch = require('watch'),
    findit = require('findit'),
    assembly = require("../assembly"),
    broadway = require('broadway'),
    async = utile.async;

var Manager = exports.Manager = function (options) {  
  this.src = options.src;
  this.dest = options.dest;
  this.watch = options.watch === undefined ? true : options.watch;

  this.core = new assembly.Core({src : this.src, dest: this.dest});
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
  
  this.core.modified(src, function(modified) {
    if(!modified) return cb();

    self.worker.compile(src, function(err, data) {
      if(err) return cb(err);

      self.core.requires(data).forEach(function(file){
        self.emit("compile", file);
      });

      self.emit("write", src, data, cb);
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

  utile.rimraf(this.dest, function(){
    var finder = findit.find(self.src);
    finder.on('file', self.compileAndWrite.bind(self));
  });
};