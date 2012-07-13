var utile = require('utile');

exports.name = "json compiler";
exports.mimeType = "application/javascript";

var JsonCompiler = exports.JsonCompiler = function(options) {
  this.options = options;
};

JsonCompiler.prototype.compile = function(file, data, cb) {
  try {
    var result = "module.exports =" + JSON.stringify(JSON.parse(data));
    cb(null, result);
  } catch(err) {
    cb(new Error("Error compiling json: " + data + ", " + err));
  }
};

exports.attach = function (options) {
  var compilerOptions = utile.mixin({}, options);
  var compiler = new JsonCompiler(compilerOptions);

  var worker = this.worker;
  worker.registerCompiler(".json", compiler);
};