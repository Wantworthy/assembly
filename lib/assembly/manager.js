var path = require('path'),
    fs = require('fs'),
    utile = require('utile'),
    watch = require('watch'),
    findit = require('findit'),
    assembly = require("../assembly"),
    mime = require('mime'),
    async = utile.async;

var Manager = exports.Manager = function (options) {
  options = utile.mixin({}, {watch: true}, options);

  this.src = options.src;
  this.dest = options.dest;
  this.watch = options.watch;

  this.worker = new assembly.Worker();
  
  if(this.watch) this.startMonitor();
};

Manager.prototype.startMonitor = function() {
  var self = this;
  
  watch.createMonitor(self.src, function (monitor) {
    self.monitor = monitor;
    
    monitor.on("changed", self.compileAndWrite.bind(self));
    monitor.on("created", self.compileAndWrite.bind(self));
    monitor.on("removed", self.remove);
  });
};

Manager.prototype.use = function () {
  this.worker.use.apply(this.worker, arguments);
};

Manager.prototype.compileAndWrite = function(src, cb) {
  if (!cb || typeof cb != 'function') {
    cb = function(){};
  }
  
  var self = this;
  this.worker.compile(src, function(err, data) {
    if(err) return cb(err);

    var outputFile = replaceExtension(src.replace(self.src, self.dest));

    utile.mkdirp(path.dirname(outputFile), function(err){
      if(err) return cb(err);
      console.log("compiling ", src, "to", outputFile);
      fs.writeFile(outputFile, data, cb);
    });
  });
};

Manager.prototype.remove = function(file) {
  var delFile = replaceExtension(file.replace(this.src, this.dest));
  fs.unlink(delFile, function (err) {
    if (err) return;
    
    console.log('successfully deleted ' + delFile);
  });
};

Manager.prototype.rebuild = function() {
  var self = this;

  utile.rimraf(this.dest, function(){
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