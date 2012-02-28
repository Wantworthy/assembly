var path = require('path'),
    util = require('util'),
    fs = require('fs'),
    mime = require('mime');

exports.mimeType = "application/javascript";

exports.attach = function (options) {
  var manager = this;

  var amdify = new Amdify(manager.core, options);
  manager.worker.registerProcessor(exports.mimeType, amdify);
};

var Amdify = exports.Amdify = function(core, options) {
  this.core = core;
};

Amdify.prototype.process = function(filename, src, callback) {
  var dependencies = this._dependencies(src),
      moduleId = this._moduleName(filename);

  var template = 'define("%s", %j, function(require, module, exports) {\n %s \n});';

  return util.format(template, moduleId, dependencies, src);
};

Amdify.prototype._moduleName = function(filename) {
  var mimeType = mime.lookup(filename);
  return path.basename(this.core.buildPath(filename), "." + mime.extension(mimeType));
};

Amdify.prototype._dependencies = function(src) {
  var self = this;

  var dependencies = this.core.requires(src).map(function(r){
    return self._moduleName(self.core.buildPath(r));
  });

  return ["require", "module", "exports"].concat(dependencies);
};