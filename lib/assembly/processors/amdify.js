var util = require('util'),
    traverse = require('traverse'),
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

  var dependencies = this.core.detective(src);

  return ["require", "module", "exports"].concat(dependencies);
};

Amdify.prototype.isCommonJS = function(src) {
  var hasRequires = this._hasRequire(src);
  var hasExports = src.match(/module.exports.\w+/) || src.match(/exports.\w+/) || src.match(/module.exports\s?=/);
  
  return hasRequires || hasExports != null;
};

Amdify.prototype._hasRequire = function(src) {
  var hasRequire = false,
      ast = uglify.parser.parse(src.toString());
  
  traverse(ast).forEach(function(node) {
    var potentialNode = Array.isArray(this.node) && this.node[0];
    if(!potentialNode) return undefined;

    if(isNamedCall(this.node, 'require')) {
      hasRequire = true;
    }
  });

  return hasRequire;
};

function isNamedCall(node, word) {
  var nodeName = node[0];
  var nodeValue = node.slice(1);

  return nodeName === 'call'
          && nodeValue[0][0] === 'name'
          && nodeValue[0][1] === word;
};