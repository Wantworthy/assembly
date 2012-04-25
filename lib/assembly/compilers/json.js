var utile = require('utile');

var JsonCompiler = exports.JsonCompiler = function(options) {
  this.options = options;
  this.name = "json compiler";
  this.mimeType = "application/javascript";
}
JsonCompiler.prototype.compile = function(file, data, cb) {
  try {
  	var result = "module.exports =" + JSON.stringify(JSON.parse(data)[this.options.env]);
    cb(null, result);
  } catch(err) {
    cb(new Error("Error compiling json: " + data + ", " + err));
  }
};

exports.attach = function (options) {
  var compilerOptions = utile.mixin({}, {'env':this.env}, options);
  var compiler = new JsonCompiler(compilerOptions);

  var worker = this.worker;
  worker.registerCompiler(".json", compiler);
};