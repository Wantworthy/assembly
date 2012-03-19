var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    mime = require('mime'),
    async = require('utile').async,
    assembly = require("../assembly");

var Worker = exports.Worker = function (manager, options) {
  options || (options = {});

  this.manager = manager;
  this.core = manager.core;
  this.compilers = {};
  this.postprocessors = {};
};

Worker.prototype.registerCompiler = function(ext, compiler) {
  this.compilers[ext] = compiler;

  // define mime type for compiler, stripping leading period for extension
  var mimeType = {};
  mimeType[compiler.mimeType] = [ext.replace(/^\./, '')];
  mime.define(mimeType);

  this.core.compilerExtensions.push(ext);
  
  // register javascript mimetypes are lookup extensions
  if(compiler.mimeType === mime.types.js) {
    this.core.extensions.push(ext);
  }
};

Worker.prototype.registerProcessor = function(mimeType, processor) {
  if(!this.postprocessors[mimeType]) {
    this.postprocessors[mimeType] = [];
  }

  this.postprocessors[mimeType].push(processor);
};

Worker.prototype.compilerFor = function(file) {
  return this.compilers[path.extname(file)];
};

Worker.prototype.processorsFor = function(filename) {
  return this.postprocessors[mime.lookup(filename)];
};

Worker.prototype.compile = function(file, callback) {
  var self = this;
  fs.readFile(file, function(err, data) {
    if(err) return callback(err);

    var compiler = self.compilerFor(file);

    if(!compiler) return callback(null, data);

    return compiler.compile(file, data.toString(), callback);
  });
};

Worker.prototype.process = function(filename, src, callback) {
  var processors = this.processorsFor(filename);
  if(!processors) return callback(null, src);

  processors.forEach(function(processor) {
    src = Buffer.isBuffer(src) ? src.toString() : src;

    try {
      src = processor.process.call(processor, filename, src);
    } catch(ex){
    }
  });

  return callback(null, src);
};

Worker.prototype.compileAndWrite = function(filename, options, cb) {
  if (!cb || typeof cb != 'function') {
    cb = options;
    options = {};
  }
  
  options = options || {};

  var self = this;

  self.compile(filename, function(err, compiledSource) {
    if(err) return cb(err);

    if(mime.lookup(filename) === mime.types.js) {
      self.core.requires(filename, compiledSource).forEach(function(file){
        self.manager.emit("compile", file);
      });
    }

    self.process(filename, compiledSource, function(err, data) {
      if(err) return cb(err);

      self.manager.emit("write", filename, data, cb);
    });
  });
};

Worker.prototype.write = function(srcFile, data, cb) {
  if (!cb || typeof cb != 'function') {
    cb = function(){};
  }

  var self = this;

  var outputFile = this.core.buildPath(srcFile, {fullpath : true});

  utile.mkdirp(path.dirname(outputFile), function(err){
    if(err) return cb(err);

    fs.writeFile(outputFile, data, function(err){
      if(err) return cb(err);

      self.manager.emit("gzip", outputFile);
      self.manager.log.info("compiled " + srcFile + " to " + outputFile);
      return cb(null, data);
    });
  });
};