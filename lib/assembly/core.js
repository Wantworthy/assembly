var path = require('path'),
    mime = require('mime'),
    detective = require('detective'),
    resolver = require('resolve');

var Core = exports.Core = function (options) { 
  this.src = options.src;
  this.dest = options.dest || this.src + "/build";

  this.paths = options.paths || [];
  this.paths.push(path.resolve(__dirname, "../../vendor"));
};

//
// ### function buildPath (options)
// #### @options {Object} **Optional** Additional options for determining the build path.
// Determines what the build path should be for the given filename
//
Core.prototype.buildPath = function(filename, options) {
  options || (options = {});
  var fileExtension = path.extname(filename);
  var mimeType = mime.lookup(fileExtension);

  var destPath = path.join(this.dest, filename.slice(this.src.length));
  if(filename.match(/node_modules/)) {
    destPath = path.join(this.dest, "vendor", filename.replace(/^.*\/node_modules/, ""));
  } else if(filename.match(/vendor/)){
    destPath = path.join(this.dest, "vendor", filename.replace(/^.*\/vendor/, ""));
  }

  var newFileName = path.basename(filename, fileExtension) + "." + mime.extension(mimeType);

  var absPath = path.join(path.dirname(destPath), newFileName);
  
  if(options.fullpath) {
    return absPath;
  } else {
    return path.relative(this.dest, absPath);
  }  
};

//
// ### function requires (options)
// #### @src {String} src code to parse out requires
// Finds source files of all requires in the given src
//
Core.prototype.requires = function(src) {
  var self = this;

  return detective(src).map(function(r) {
    try {
      return resolver.sync(r, {basedir : self.src, extensions : [".js", ".coffee"], paths: self.paths });
    } catch(ex){return null}
  }).filter(Boolean);
};