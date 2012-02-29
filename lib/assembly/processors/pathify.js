/*
 * pathify.js: Processor to convert relative path requires to aboslute requires
 *
 * (C) 2012, Wantworthy Inc.
 */

var burrito = require('burrito');

exports.mimeType = "application/javascript";

exports.attach = function (options) {
  var manager = this;

  var pathify = new Pathify(manager.core, options);
  manager.worker.registerProcessor(exports.mimeType, pathify);
};

var Pathify = exports.Pathify = function(core, options) {
  options || (options = {});
  this.core = core;
  this.word = options.word || 'require';
};

Pathify.prototype.process = function(filename, src) {
  var self = this;

  var out = burrito(src, function(node) {
    if (self._isRequire(node)) {
      var expr = node.value[1][0];
  
      if (expr[0].name === 'string') {
        expr[1] = self.fullRequirePath(filename, expr[1]);
      }
    }

    if(self._isDotRequire(node)) {
      var expr = node.value[0][2][0];
      if (expr[0].name === 'string') {
        expr[1] = self.fullRequirePath(filename, expr[1]);
      }
    }

    if(self._isDotCallRequire(node)) {
      var expr = node.value[0][1][2][0];
      if (expr[0].name === 'string') {
        expr[1] = self.fullRequirePath(filename, expr[1]);
      }
    }
  });

  return out;
};

Pathify.prototype._isRequire = function(node) {
  return node.name === 'call'
          && node.value[0][0] === 'name'
          && node.value[0][1] === this.word;
};

Pathify.prototype._isDotRequire = function(node) {
  return (node.name === 'dot' || node.name === 'call')
          && node.value[0][0] === 'call'
          && node.value[0][1][0] === 'name'
          && node.value[0][1][1] === this.word;
};

Pathify.prototype._isDotCallRequire = function(node) {
  return node.name === 'call'
          && node.value[0][0] === 'dot'
          && node.value[0][1][0] === 'call'
          && node.value[0][1][1][0] === 'name'
          && node.value[0][1][1][1] === this.word;
};

Pathify.prototype.fullRequirePath = function(filename, r) {
  var f = this.core.resolve(filename, r);
  return this.core.buildPath(f, {extension: false});
};
