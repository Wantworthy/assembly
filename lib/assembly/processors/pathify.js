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
  this.keywords = ["require", "module", "exports"];
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
    }

    if(self._isDefine(this.node)) {
      var defineStatement = this.node.slice(1)[1];
      defineStatement.forEach(function(node) {
        self.processDefine(filename, node);
      });
    }

    if(self._isRequireArray(this.node)) {
      var requiresArray =  this.node.slice(1)[1][0][1];
      requiresArray.forEach(function(requireNode){
        if (requireNode[0] === 'string') {
          requireNode[1] = self.fullRequirePath(filename, requireNode[1]);
        }
      });
    }
  });

  return uglify.uglify.gen_code(out, { beautify : true });;
};

Pathify.prototype.processDefine = function(filename, node) {
  var self = this;

  if (node[0] === 'string') {
    node[1] = self.fullRequirePath(filename, node[1]);
  } else {
    self.processDeps(filename, node);
  }
};

Pathify.prototype.processDeps = function(filename, node) {
  var self = this;

  if(node && Array.isArray(node) && node[0] === 'array') { //parse deps
    node[1].forEach(function(n){
      if(n[0] === 'string' && self.keywords.indexOf(n[1]) == -1) {
        n[1] = self.fullRequirePath(filename, n[1]);
      }
    });
  }
};

Pathify.prototype._isRequire = function(node) {
  return this.isNamedNode(node, "require");
};

Pathify.prototype._isDefine = function(node) {
  return this.isNamedNode(node, "define");
};

Pathify.prototype._isRequireArray = function(node) {
  var nodeName = node[0];
  var nodeValue = node.slice(1);

  return this._isRequire(node) && nodeValue[1][0][0] === 'array';
};

Pathify.prototype.isNamedNode = function(node, word) {
  var nodeName = node[0];
  var nodeValue = node.slice(1);

  return nodeName === 'call'
          && nodeValue[0][0] === 'name'
          && nodeValue[0][1] === word;
};

Pathify.prototype.fullRequirePath = function(filename, r) {
  try{
    var f = this.core.resolve(filename, r);
    return this.core.buildPath(f, {extension: false});
  } catch(err) {
    return r;
  }
};
