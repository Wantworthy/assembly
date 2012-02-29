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
  this.word = options.word || 'require';
};

Pathify.prototype.process = function(filename, src) {
  var self = this;
  var ast = uglify.parser.parse(src.toString());
  var i = 0;
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

  // var out = burrito(src, function(node) {
  //   if (self._isRequire(node)) {
  //     var expr = node.value[1][0];
  
  //     if (expr[0].name === 'string') {
  //       expr[1] = self.fullRequirePath(filename, expr[1]);
  //     }
  //   }

  //   if(self._isDotRequire(node)) {
  //     var expr = node.value[0][2][0];
  //     if (expr[0].name === 'string') {
  //       expr[1] = self.fullRequirePath(filename, expr[1]);
  //     }
  //   }

  //   if(self._isDotCallRequire(node)) {
  //     var expr = node.value[0][1][2][0];
  //     if (expr[0].name === 'string') {
  //       expr[1] = self.fullRequirePath(filename, expr[1]);
  //     }
  //   }
  // });

  return uglify.uglify.gen_code(out, { beautify : true });;
};

Pathify.prototype._isRequire = function(node) {
  var nodeName = node[0];
  var nodeValue = node.slice(1);

  return nodeName === 'call'
          && nodeValue[0][0] === 'name'
          && nodeValue[0][1] === this.word;
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
