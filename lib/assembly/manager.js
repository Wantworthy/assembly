var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    watch = require('watch'),
    findit = require('findit'),
    assembly = require("../assembly"),
    mime = require('mime'),
    async = utile.async;

var Manager = exports.Manager = function (options) {
  options || (options = {});

  this.src = options.src;
  this.out = options.out;
  this.worker = new assembly.Worker();
};

Manager.prototype.start = function() {
  var self = this;

  watch.createMonitor(self.src, function (monitor) {
    self.monitor = monitor;
    
    monitor.on("changed", self.compileAndWrite.bind(self));
    monitor.on("created", self.compileAndWrite.bind(self));
    monitor.on("removed", self.delete);
  });

  this.rebuild();
};

Manager.prototype.compileAndWrite = function(src, cb) {
  if (!cb || typeof cb != 'function') {
    cb = function(){};
  }
  
  var self = this;
  this.worker.compile(src, function(err, data) {
    if(err) return cb(err);

    var outputFile = replaceExtension(src.replace(self.src, self.out));

    utile.mkdirp(path.dirname(outputFile), function(err){
      if(err) return cb(err);
      console.log("compiling ", src, "to", outputFile);
      fs.writeFile(outputFile, data, cb);
    });
  });
};

Manager.prototype.delete = function(file) {
  var delFile = replaceExtension(file.replace(this.src, this.out));
  fs.unlink(delFile, function (err) {
    if (err) return;
    
    console.log('successfully deleted ' + delFile);
  });
};

Manager.prototype.rebuild = function() {
  var self = this;

  utile.rimraf(this.out, function(){
    var finder = findit.find(self.src);
    finder.on('file', self.compileAndWrite.bind(self));
  });
};

// replace file paths extension with a given extension
function replaceExtension(filePath) {
  var fileExtension = path.extname(filePath);
  var mimeType = mime.lookup(fileExtension);

  var newFileName = path.basename(filePath, fileExtension) + "." + mime.extension(mimeType);

  return path.join(path.dirname(filePath), newFileName);
};