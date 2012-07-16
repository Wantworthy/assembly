// attach to listen for gzip events and write out a gzipped file
var utile = require('utile'),
    path = require('path'),
    fs = require('fs');

exports.attach = function (options) {
  var manager = this;

  manager.on("digest", generateDigest.bind(manager));
};

function generateDigest(srcFile, data) {
  var manager = this;

  manager.core.md5sum(srcFile, function(err, md5sum) {
    if(err) return;

    var digestFile = manager.core.buildPath(srcFile, {fullpath : true, version: md5sum});

    writeFile.call(manager, digestFile, data, function(err) {
      manager.log.info("compiled digest of" + srcFile + " to " + digestFile);
    });
  });
}

function writeFile(digestFile, data, callback) {
  var manager = this;

  utile.mkdirp(path.dirname(digestFile), function(err){
    if(err) return callback(err);

    fs.writeFile(digestFile, data, function(err){
      if(err) return callback(err);

      manager.emit("gzip", digestFile);
      
      return callback(null, digestFile);
    });
  });
}