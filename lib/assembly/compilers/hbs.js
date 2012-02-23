var handlebars = require('Handlebars');

exports.name = "handlebars template compiler";
exports.mimeType = "application/javascript";

exports.compile = function(file, data, cb) {
  try {
    var output = [];
    output.push('var Handlebars = require("handlebars.runtime")');
    output.push('module.exports = Handlebars.template(' + handlebars.precompile(data) + ');' );

    cb(null, output.join("\n"));
  } catch(err) {
    cb(new Error("Error compiling template: " + data + ", " + err.message));
  }
};

exports.attach = function (options) {
  var worker = this;
  worker.registerCompiler(".hbs", module.exports);
};