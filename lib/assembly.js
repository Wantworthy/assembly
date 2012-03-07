var path = require('path'),
    utile = require('utile');

var assembly = exports;

assembly.Core     = require('./assembly/core').Core;
assembly.Worker   = require('./assembly/worker').Worker;
assembly.Manager  = require('./assembly/manager').Manager;

assembly.compilers = utile.requireDirLazy(path.join(__dirname, 'assembly', 'compilers'));
assembly.processors = utile.requireDirLazy(path.join(__dirname, 'assembly', 'processors'));
assembly.plugins = utile.requireDirLazy(path.join(__dirname, 'assembly', 'plugins'));

require('pkginfo')(module, 'version');

assembly.createAssembler = function (options) {
  return new assembly.Manager(options);
};