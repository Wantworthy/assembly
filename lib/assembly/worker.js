var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    broadway = require('broadway'),
    mime = require('mime'),
    assembly = require("../assembly");

var Worker = exports.Worker = function (options) {
  broadway.App.call(this);
  options || (options = {});

  this.compilers = {};
  this.postprocessors = {};

  this.use(assembly.compilers.coffee);
  // console.log(assembly.compilers);
  // this.use(assembly.compilers);
};

utile.inherits(Worker, broadway.App);

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

Worker.prototype.compile = function(file, callback){
  var compiler = this.compilerFor(file);
  
  fs.readFile(file,'utf8', function(err, data) {
    if(err) return callback(err);

    if(!compiler) return callback(null, data);

    return compiler.compile.call(this, file, data, callback);
  });
};