var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    mime = require('mime'),
    assembly = require("../assembly");

var Worker = exports.Worker = function (options) {
  options || (options = {});

  this.compilers = {};
  this.postprocessors = {};
};

Worker.prototype.registerCompiler = function(ext, compiler) {
  this.compilers[ext] = compiler;

  // define mime type for compiler, stripping leading period for extension
  var mimeType = {};
  mimeType[compiler.mimeType] = [ext.replace(/^\./, '')];
  mime.define(mimeType);
};

Worker.prototype.compilerFor = function(file) {
  return this.compilers[path.extname(file)];
};

Worker.prototype.compile = function(file, callback) {
  var self = this;
  fs.readFile(file,'utf8', function(err, data) {
    if(err) return callback(err);

    var compiler = self.compilerFor(file);

    if(!compiler) return callback(null, data);

    return compiler.compile(file, data, callback);
  });
};