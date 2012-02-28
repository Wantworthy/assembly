var fs = require('fs'),
    path = require('path'),
    utile = require('utile'),
    broadway = require("broadway"),
    Core = require("../lib/assembly/core").Core;

var helper = exports;

helper.testBuildDir = __dirname +"/build";
helper.testSrcDir = __dirname +"/fixtures";
helper.core = new Core({src : helper.testSrcDir, dest : helper.testBuildDir});

helper.mkTestDir = function (cb) {
  path.exists(helper.testBuildDir, function (exists) {
    if(exists) return cb();
    fs.mkdir(helper.testBuildDir, cb);
  });
};

helper.rmTestDir = function(cb) {
  utile.rimraf(helper.testBuildDir, cb);
};

helper.modifyTimes = function(srcFile, srcFileModTime, buildFileModTime) {
  var buildFile = helper.core.buildPath(srcFile, {fullpath: true});
  fs.writeFileSync(buildFile, "blah");

  fs.utimesSync(srcFile, srcFileModTime, srcFileModTime);
  fs.utimesSync(buildFile, buildFileModTime, buildFileModTime);
};

helper.mockApp = function() {
  var mock = new broadway.App();
  mock.src = helper.testSrcDir;
  mock.dest = helper.testBuildDir;
  
  return mock;
}