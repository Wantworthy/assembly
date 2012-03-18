var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    readDirFiles = require('read-dir-files'),
    assembly = require("../assembly"),
    broadway = require('broadway'),
    mime = require('mime'),
    async = utile.async,
    url = require('url');

var Manager = exports.Manager = function (options) {  
  this.src = path.normalize(options.src);
  this.dest = path.normalize(options.dest);
  this.watch = options.watch === undefined ? true : options.watch;
  this.cache = options.cache === undefined ? true : options.cache;
  this.overwrite = options.overwrite || false;

  this.core = new assembly.Core({src : this.src, dest: this.dest, cache: this.cache});
  this.worker = new assembly.Worker(this.core);

  var self = this;

  broadway.App.call(this);

  this.use(broadway.plugins.log, {console: {colorize : true}});

  utile.each(assembly.compilers, function(comp) {
    self.use(comp);
  });

  this.processQueue = async.queue(function (task, callback) {
    self.compileAndWrite(task.src, task.options, callback);
  }, 5);

  self.processQueue.drain = function() {
    console.log('All assets have been processed');
  };

  this.on("compile", function(src, options) {
    self.processQueue.push({src: src, options : options}, function (err) {
      if(err && err.skipped) {
        self.log.info("skipped compiling " + src);
      } else if(err) {
        self.log.error("error compiling " + src + " " + err);
      }
    });
  });

  this.on("write", this.write);
  this.on("remove", this.remove);

  if(this.watch) {
    self.use(assembly.plugins.watcher);
  }
};

utile.inherits(Manager, broadway.App);

Manager.prototype.compileAndWrite = function(filename, options, cb) {
  if (!cb || typeof cb != 'function') {
    cb = options;
    options = {};
  }
  
  options = options || {};

  var self = this;
  
  this.core.modified(filename, function(modified) {
    if(!modified && !options.force) {
      var outputFile = self.core.buildPath(filename, {fullpath : true});
      return fs.readFile(outputFile, cb);
    }

    self.worker.compile(filename, function(err, compiledSource) {
      if(err) return cb(err);

      if(mime.lookup(filename) === mime.types.js) {
        self.core.requires(filename, compiledSource).forEach(function(file){
          self.emit("compile", file);
        });
      }

      self.worker.process(filename, compiledSource, function(err, data) {
        if(err) return cb(err);

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

    fs.writeFile(outputFile, data, function(err){
      if(err) return cb(err);

      self.emit("gzip", outputFile);
      self.log.info("compiled " + srcFile + " to " + outputFile);
      return cb(null, data);
    });
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

Manager.prototype.start = function(callback) {
  if (!callback || typeof callback != 'function') {
    callback = function(){};
  }

  var self = this;

  self.init(function(err){
    if(err) return callback(err);

    self.rebuild(self.overwrite);
    return callback();
  });
};

Manager.prototype.rebuild = function(removeDir) {
  var self = this;

  var emit = self.emit.bind(self);
  var f = function() {
    readDirFiles.list(self.src).on('file', async.apply(emit, 'compile'));
  };

  if(removeDir) {
    utile.rimraf(this.dest, f);
  } else {
    f();
  }
};

Manager.prototype.server = function() {
  var self = this;

  return function(req, res, next) {
    // Figure out the path for the file from the given url
    var parsed = url.parse(req.url),
        pathname = decodeURI(parsed.pathname),
        options = {force: false};

    self.core.reverselookup(pathname, function(err, file){
      if(err || !file) return next();

      options.force = mime.lookup(file) === mime.types.css;

      self.compileAndWrite(file, options, function(err, data) {
        return next();
      });      
    });
  }
};