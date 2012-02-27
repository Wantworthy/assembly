var path = require('path'),
    utile = require('utile');

var assembly = exports;

assembly.Core     = require('./assembly/core').Core;
assembly.Worker   = require('./assembly/worker').Worker;
assembly.Manager  = require('./assembly/manager').Manager;

assembly.compilers = utile.requireDirLazy(path.join(__dirname, 'assembly', 'compilers'));

require('pkginfo')(module, 'version');

assembly.start = function (options) {
  return new assembly.Manager(options);
};