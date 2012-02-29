/*
 * pathify.js: Processor to convert relative path requires to aboslute requires
 *
 * (C) 2012, Wantworthy Inc.
 */

var traverse = require('traverse'),
    util = require('util'),
    uglify = require('uglify-js');

exports.mimeType = "application/javascript";

exports.attach = function (options) {
  var manager = this;

  var pathify = new Pathify(manager.core, options);
  manager.worker.registerProcessor(exports.mimeType, pathify);
};

var Pathify = exports.Pathify = function(core, options) {
  options || (options = {});
  this.core = core;
  this.words = options.words || ['require', 'define'];
};

Pathify.prototype.process = function(filename, src) {
  var self = this;
  var ast = uglify.parser.parse(src.toString());

  var out = traverse(ast).map(function(node) {

    var potentialNode = Array.isArray(this.node) && this.node[0];
    if(!potentialNode) return undefined;

    if(self._isRequire(this.node)) {
      var expr = this.node.slice(1)[1][0];      
      if (expr[0] === 'string') {
        expr[1] = self.fullRequirePath(filename, expr[1]);
      }
    };
  });

  return uglify.uglify.gen_code(out, { beautify : true });;
};

Pathify.prototype._isRequire = function(node) {
  var nodeName = node[0];
  var nodeValue = node.slice(1);

  return nodeName === 'call'
          && nodeValue[0][0] === 'name'
          && this.words.indexOf(nodeValue[0][1]) != -1;
};

Pathify.prototype.fullRequirePath = function(filename, r) {
  try{
    var f = this.core.resolve(filename, r);
    return this.core.buildPath(f, {extension: false});
  } catch(err) {
    return r;
  }
};
