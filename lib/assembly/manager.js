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
  this.env = options.env || process.env.NODE_ENV || 'development';
  this.core = new assembly.Core({src : this.src, dest: this.dest, cache: this.cache});
  this.worker = new assembly.Worker(this);

  var self = this;

  broadway.App.call(this);

  this.use(broadway.plugins.log, {console: {colorize : true}});
  this.use(broadway.plugins.config);

  this.config.remove('literal');
  this.config.file({ file: path.join(this.dest, ".assets-cache.json") });

  utile.each(assembly.compilers, function(comp) {
    self.use(comp);
  });

  this.inQueue = {};
  this.processQueue = async.queue(self.processTask(), 5);

  self.processQueue.drain = function() {
    self.writeConfig(function(err) {
      self.log.info('All assets have been processed');
    });
  };

  this.on("compile", this.addToQueue.bind(self));
  this.on("write", this.worker.write.bind(this.worker));
  this.on("remove", this.remove);

  if(this.watch) {
    self.use(assembly.plugins.watcher);
  }
};

utile.inherits(Manager, broadway.App);

Manager.prototype.processTask = function() {
  var self = this;

  return function (task, callback) {
    self.core.md5sum(task.src, function(err, md5sum) {
      if(err) return callback(err);

      task.options = task.options || {};
      var processedKey = "assets:"+ task.src;
      var prevmd5 = self.config.get(processedKey);
      
      self.config.set(processedKey, md5sum);
      if(task.options.force || prevmd5 != md5sum) {
        self.worker.compileAndWrite(task.src, task.options, callback);
      } else {
        var outputFile = self.core.buildPath(task.src, {fullpath : true});
        return fs.readFile(outputFile, function (err, data) {
          if(err && err.code == 'ENOENT') {
            err.skipped = true;
          }

          return callback(err, data);
        });
      }
    });
  };
};

Manager.prototype.addToQueue = function(src, options, callback){
  if (!callback || typeof callback != 'function') {
    callback = function(){};
  }
  
  var self = this;
  if(self.inQueue[src]) return callback();

  self.inQueue[src] = true;

  this.processQueue.push({src: src, options : options}, function (err, data) {
    if(err && err.skipped) {
      self.log.info("skipped compiling " + src);
    } else if(err) {
      self.log.error("error compiling " + src + " " + err);
    }

    delete self.inQueue[src];

    return callback(err, data);
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

Manager.prototype.writeConfig = function(cb) {
  var self = this;

  self.config.save(function(err) {
    if(err) return cb(err);

    var paths = Object.keys(self.config.get('assets')).reduce(function(memo, asset){
      if(mime.lookup(asset) != mime.types.js) return memo;

      var md5sum = self.config.get('assets')[asset];
      var buildPath = self.core.buildPath(asset, {extension : false});
      
      memo[buildPath] = self.core.buildPath(asset, {extension : false, version: md5sum});
   
      return memo;
    }, {});

    var template = "(function() {require.config({paths: %j }); }).call(this);";
    var out = self.core.prettyPrint(utile.format(template, paths));

    fs.writeFile(path.join(self.core.dest, "asset-manifest.js"), out, cb);
  });

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
  };
};