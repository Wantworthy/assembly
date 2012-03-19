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
  this.use(broadway.plugins.config);

  this.config.file({ file: path.join(this.dest, "assets-config.json") });

  utile.each(assembly.compilers, function(comp) {
    self.use(comp);
  });

  this.inQueue = {};
  this.processQueue = async.queue(self.processTask(), 5);

  self.processQueue.drain = function() {
    self.config.stores.file.merge('assets', self.config.get('assets'));
    
    self.config.save(function(err) {
      self.log.info('All assets have been processed');
    });
  };

  this.on("compile", this.addToQueue.bind(self));
  this.on("write", this.write);
  this.on("remove", this.remove);

  if(this.watch) {
    self.use(assembly.plugins.watcher);
  }
};

utile.inherits(Manager, broadway.App);

Manager.prototype.processTask = function() {
  var self = this;

  return function (task, callback) {
    self.stats(task.src, function(err, stats) {
      if(err) return callback(err);

      task.options = task.options || {};
      var processedKey = "assets:"+ task.src;
      var prevmd5 = self.config.get(processedKey);
      
      self.config.set(processedKey, stats.md5sum);
      if(task.options.force || (stats.modified && prevmd5 != stats.md5sum) ) {
        self.compileAndWrite(task.src, task.options, callback);
      } else {
        var outputFile = self.core.buildPath(task.src, {fullpath : true});
        return fs.readFile(outputFile, callback);
      }
    });
  }
};

Manager.prototype.addToQueue = function(src, options, callback){
  if (!callback || typeof callback != 'function') {
    callback = function(){};
  };
  
  var self = this;
  if(self.inQueue[src]) return callback();

  self.inQueue[src] = true;

  this.processQueue.push({src: src, options : options}, function (err, data) {
    if(err && err.skipped) {
      self.log.info("skipped compiling " + src);
    } else if(err) {
      self.log.error("error compiling " + src + " " + err);
    }

    delete self.inQueue[src]

    return callback(err, data);
  });
};

Manager.prototype.stats = function(filename, callback){
  var self = this;

  async.parallel({
    modified: async.apply(self.core.modified.bind(self.core), filename),
    md5sum: async.apply(self.core.md5sum, filename)
  }, function(err, results) {
    return callback(err, results);
  });
};

Manager.prototype.compileAndWrite = function(filename, options, cb) {
  if (!cb || typeof cb != 'function') {
    cb = options;
    options = {};
  }
  
  options = options || {};

  var self = this;

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

      self.emit('compile', file, options, function(err, data) {
        return next();
      });      
    });
  }
};