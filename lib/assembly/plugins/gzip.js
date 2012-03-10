// attach to listen for gzip events and write out a gzipped file
var zlib = require('zlib'),
    fs = require('fs');

exports.attach = function (options) {
  var manager = this;

  manager.on("gzip", compress.bind(manager));
};

function compress(filename) {
  var gzip = zlib.createGzip({level: 9}),
      gzipFile = filename + ".gz",
      inp = fs.createReadStream(filename),
      out = fs.createWriteStream(gzipFile);

  this.log.info("gzipping " + filename +" to " + gzipFile);
  inp.pipe(gzip).pipe(out);
};