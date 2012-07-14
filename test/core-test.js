var TestHelper = require("./test-helper"),
    util = require('utile'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("Core", function() {
  var core = TestHelper.core;

  describe('Build Path', function() {

    it("should return relative vendor path for libs in node_modules", function(){
      var dest = core.buildPath("/home/user/code/node/assembly/node_modules/underscore/underscore.js");
      dest.should.eql("js/vendor/underscore/underscore.js");
    });

    it("should return absolute vendor path for libs in node_modules", function(){
      var dest = core.buildPath("/home/user/code/node/assembly/node_modules/underscore/underscore.js", {fullpath: true});
      dest.should.eql(core.destJSRoot + "/vendor/underscore/underscore.js");
    });

    it('should return relative build/vendor path for src/vendor lib', function() {
      var dest = core.buildPath(core.jsRoot + "/vendor/handlebars.runtime.js");
      dest.should.eql("js/vendor/handlebars.runtime.js");
    });

    it('should return absolute build/vendor path for src/vendor lib', function() {
      var dest = core.buildPath(core.src + "/vendor/handlebars.runtime.js", {fullpath : true});
      dest.should.eql(core.destJSRoot + "/vendor/handlebars.runtime.js");
    });

    it('should return relative dest path for src file', function() {
      var dest = core.buildPath(core.src +"/foo.js");
      dest.should.eql("foo.js");
    });

    it('should return relative dest path without extension for src file', function() {
      var dest = core.buildPath(core.src +"/foo.js", {extension: false});
      dest.should.eql("foo");
    });

    it('should return absolute dest path for src file', function() {
      var dest = core.buildPath(core.src +"/foo.js", {fullpath : true});
      dest.should.eql(core.dest + "/foo.js");
    });

    it('should return absolute dest path with no extension for for src file', function() {
      var dest = core.buildPath(core.src +"/foo.js", {fullpath : true, extension: false});
      dest.should.eql(core.dest + "/foo");
    });

    it('should return absolute path with version string and no extension', function() {
      var dest = core.buildPath(core.src +"/foo.js", {fullpath : true, extension: false, version: "v1"});
      dest.should.eql(core.dest + "/foo-v1");
    });

    it('should return absolute path with version string and extension', function() {
      var dest = core.buildPath(core.src +"/foo.js", {fullpath : true, extension: true, version: "v1"});
      dest.should.eql(core.dest + "/foo-v1.js");
    });

    it('should return relative path with version string and no extension', function() {
      var dest = core.buildPath(core.src +"/foo.js", {fullpath : false, extension: false, version: "v1"});
      dest.should.eql("foo-v1");
    });

    it('should return jpg for image with jpg extension', function() {
      var dest = core.buildPath(core.src +"/images/cathat.jpg");
      dest.should.eql("images/cathat.jpg");
    });
  });

  describe('Requires', function() {
    
    it("should return single relative require", function() {
      var filename = core.src+ "/app.js";
      var requires = core.requires(filename, fs.readFileSync(filename));
      requires.should.have.length(1);
      requires.should.eql([core.src + "/foo.js"]);
    });

    it("should return nested foo.js as dep", function() {
      var filename = core.src+ "/nested/baz.js";
      var requires = core.requires(filename, fs.readFileSync(filename));
      requires.should.have.length(1);
      requires.should.eql([core.src + "/nested/foo.js"]);
    });

    it("should return simbling foo and parent foo deps", function() {
      var filename = core.src+ "/nested/parent.js";
      var requires = core.requires(filename, fs.readFileSync(filename));
      requires.should.have.length(2);
      requires.should.include(core.src + "/nested/foo.js");
      requires.should.include(core.src + "/foo.js");
    });

    it("should return requires from relative, and vendor dirs", function() {
      var filename = core.src+ "/complex.js";
      var requires = core.requires(filename, fs.readFileSync(filename));
      requires.should.have.length(3);

      requires.should.include(core.src + "/foo.js");
      requires.should.include(path.resolve(__dirname + "/../vendor", "handlebars.runtime.js"));
      requires.should.include(path.resolve(__dirname + "/../vendor", "underscore.js"));
    });
  });

  describe("Resolve", function(){
    it("should find jquery", function() {
      var out = core.resolve(core.jsRoot +"/vendor/jquery.js", "jquery");
      out.should.equal(core.jsRoot +"/vendor/jquery.js");
    });

    it("should find jst template", function() {
      core.extensions.push(".jst");
      var out = core.resolve(core.src +"/app.js", "./templates/simple");
      out.should.equal(core.src +"/templates/simple.jst");
    });

  });

  describe("Modified", function() {
    before(TestHelper.mkTestDir);

    after(TestHelper.rmTestDir);

    it("should callback with true for source file with mtime greater than build files mtime", function(done) {
      var srcFile = core.src+ "/app.js",
          now = new Date().getTime(),
          future = new Date().getTime() + 555;

      TestHelper.modifyTimes(srcFile, future, now);
  
      core.modified(srcFile, function(err, modified){
        modified.should.be.true;
        done();
      })
    });

    it("should callback with false for files with same mtime", function(done) {
      var srcFile = core.src+ "/app.js",
          now = new Date().getTime();

      TestHelper.modifyTimes(srcFile, now, now);
  
      core.modified(srcFile, function(err, modified){
        modified.should.be.false;
        done();
      })
    });


    it("should callback with false when build file has mtime greater than source file", function(done) {
      var srcFile = core.src+ "/app.js",
          now = new Date().getTime(),
          future = new Date().getTime() + 555;

      TestHelper.modifyTimes(srcFile, now, future);
  
      core.modified(srcFile, function(err, modified){
        modified.should.be.false;
        done();
      })
    });

  });

});