var util = require('util'),
    uglify = require("uglify-js");

exports.mimeType = "application/javascript";

exports.attach = function (options) {
  var manager = this;

  var amdify = new Amdify(manager.core, options);
  manager.worker.registerProcessor(exports.mimeType, amdify);
};

var Amdify = exports.Amdify = function(core, options) {
  this.core = core;
};

Amdify.prototype.process = function(filename, src) {
  var dependencies = this._dependencies(filename, src),
      moduleId = this._moduleID(filename);

  if(moduleId.match(/vendor/) || !this.isCommonJS(src)) {
    return src;
  } else {
    var template = 'define("%s", %j, function(require, module, exports) {\n %s \n});';
    var defined = util.format(template, moduleId, dependencies, src);

    var ast = uglify.parser.parse(defined);
    return uglify.uglify.gen_code(ast, { beautify : true});
  }
};

Amdify.prototype._moduleID = function(filename) {
  return this.core.buildPath(filename, {extension: false});
};

Amdify.prototype._dependencies = function(filename, src) {
  var self = this;

  var dependencies = this.core.requires(filename, src).map(self._moduleID, self);

  return ["require", "module", "exports"].concat(dependencies);
};

Amdify.prototype.isCommonJS = function(src) {
  var hasRequires = src.match(/require\(['"]\w+['"]\)/);
  var hasExports = src.match(/module.exports.\w+/) || src.match(/exports.\w+/);

  return hasRequires != null || hasExports != null;
};