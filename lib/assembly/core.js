var path = require('path'),
    fs = require('fs'),
    mime = require('mime'),
    detective = require('detective'),
    deputy = require('deputy'),
    resolver = require('resolve'),
    utile = require('utile'),
    async = utile.async;

var Core = exports.Core = function (options) { 
  this.src = options.src;
  this.dest = options.dest || this.src + "/build";

  this.paths = options.paths || [];
  this.paths.push(options.src);
  
  if(path.existsSync(options.src + "/vendor") ) {
    this.paths.push(options.src + "/vendor");
  }
  
  this.paths.push(path.resolve(__dirname, "../../vendor"));

  if (options.cache) {
    var file = process.env.HOME + '/.config/assembly/cache.json';
    this.detective = deputy(file);
  } else{
    this.detective = detective;
  }
};

//
// ### function buildPath (filename, options)
// #### @filename {string} Source filename to determine build path for.
// #### @options {Object} **Optional** Additional options for determining the build path.
// Determines what the build path should be for the given filename
//
Core.prototype.buildPath = function(filename, options) {
  options || (options = {});
  options.extension = options.extension === undefined ? true : options.extension;
  var fileExtension = path.extname(filename);
  var mimeType = mime.lookup(fileExtension);

  var destPath = path.join(this.dest, filename.slice(this.src.length));
  if(filename.match(/node_modules/)) {
    destPath = path.join(this.dest, "vendor", filename.replace(/^.*\/node_modules/, ""));
  } else if(filename.match(/vendor/)){
    destPath = path.join(this.dest, "vendor", filename.replace(/^.*\/vendor/, ""));
  }

  var newFileName;

  if(options.extension) {
    newFileName = path.basename(filename, fileExtension) + "." + mime.extension(mimeType);
  } else {
    newFileName = path.basename(filename, fileExtension);
  }

  var absPath = path.join(path.dirname(destPath), newFileName);
  
  if(options.fullpath) {
    return absPath;
  } else {
    return path.relative(this.dest, absPath);
  }  
};

//
// ### function requires (src)
// #### @src {String} src code to parse out requires
// Finds source files of all requires in the given src
//
Core.prototype.requires = function(filename, src) {
  var self = this;

  return self.detective(src).map(function(r) {
    return self.resolve(filename, r);
  }).filter(Boolean);
};

//
// ### function resolve (filename, r)
// #### @src {String} src code to parse out requires
// #### @r {String} require call to resolve to a file
// Resolves requires to filename
//
Core.prototype.resolve = function(filename, r) {
  var self = this;
  try {
    return resolver.sync(r, {basedir : path.dirname(filename), extensions : [".js", ".coffee"], paths: self.paths });
  } catch(ex){return null;}
};

//
// ### function modified (filename, callback)
// #### @filenam {String} filename to check if it has been modified
// #### @callback {Function}
// Checks if given source file has been modified from the last time it was built
//
Core.prototype.modified = function(filename, callback) {
  var self = this;
  var modified = false;

  async.parallel({
      srcStats: async.apply(fs.stat, filename),
      destStats: async.apply(fs.stat, self.buildPath(filename, {fullpath : true}))
    },
    function(err, results) {
      if(err || (results.srcStats.mtime > results.destStats.mtime) ) {
        modified = true;
      }

      return callback(modified);
    }
  );
};