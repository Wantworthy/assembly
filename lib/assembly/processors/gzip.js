// attach to listen for gizp and write out a gzipped file
// this should probably be moved to a plugin dir

var zlib = require('zlib'),
    fs = require('fs');

exports.attach = function (options) {
  var manager = this;

  manager.on("gzip", compress.bind(manager));
};

function compress(filename) {
  var gzip = zlib.createGzip(),
      gzipFile = filename + ".gz",
      inp = fs.createReadStream(filename),
      out = fs.createWriteStream(gzipFile);

  this.log.info("gzipping " + filename +" to " + gzipFile);
  inp.pipe(gzip).pipe(out);
};