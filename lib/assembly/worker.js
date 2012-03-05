var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    mime = require('mime'),
    async = require('utile').async,
    assembly = require("../assembly");

var Worker = exports.Worker = function (core, options) {
  options || (options = {});

  this.core = core;
  this.compilers = {};
  this.postprocessors = {};
};

Worker.prototype.registerCompiler = function(ext, compiler) {
  this.compilers[ext] = compiler;

  // define mime type for compiler, stripping leading period for extension
  var mimeType = {};
  mimeType[compiler.mimeType] = [ext.replace(/^\./, '')];
  mime.define(mimeType);

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

    src = processor.process.call(processor, filename, src);
  });

  return callback(null, src);
};