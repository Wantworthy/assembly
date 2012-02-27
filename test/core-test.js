var Core = require("../lib/assembly/core").Core,
    util = require('utile'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("Core", function() {
  var core;

  before(function() {
    core = new Core({src: __dirname + "/fixtures", dest : __dirname + "/build"});
  });

  describe('Build Path', function() {

    it("should return relative vendor path for libs in node_modules", function(){
      var dest = core.buildPath("/home/user/code/node/assembly/node_modules/underscore/underscore.js");
      dest.should.eql("vendor/underscore/underscore.js");
    });

    it("should return absolute vendor path for libs in node_modules", function(){
      var dest = core.buildPath("/home/user/code/node/assembly/node_modules/underscore/underscore.js", {fullpath: true});
      dest.should.eql(core.dest + "/vendor/underscore/underscore.js");
    });

    it('should return relative build/vendor path for src/vendor lib', function() {
      var dest = core.buildPath(core.src + "/vendor/handlebars.runtime.js");
      dest.should.eql("vendor/handlebars.runtime.js");
    });    

    it('should return absolute build/vendor path for src/vendor lib', function() {
      var dest = core.buildPath(core.src + "/vendor/handlebars.runtime.js", {fullpath : true});
      dest.should.eql(core.dest + "/vendor/handlebars.runtime.js");
    });

    it('should return relative dest path for src file', function() {
      var dest = core.buildPath(core.src +"/foo.js");
      dest.should.eql("foo.js");
    });    

    it('should return absolute dest path for src file', function() {
      var dest = core.buildPath(core.src +"/foo.js", {fullpath : true});
      dest.should.eql(core.dest + "/foo.js");
    });
  });

  describe('Requires', function(){
    
    it("should return single relative require", function() {
      var requires = core.requires(fs.readFileSync(core.src+ "/app.js"));
      requires.should.have.length(1);
      requires.should.eql([core.src + "/foo.js"]);
    });

    it("should return requires from relative, vendor and node_modules", function() {
      var requires = core.requires(fs.readFileSync(core.src+ "/complex.js"));
      requires.should.have.length(3);

      requires.should.include(core.src + "/foo.js");
      requires.should.include(path.resolve(__dirname + "/../vendor", "handlebars.runtime.js"));
      requires.should.include(require.resolve('underscore'));
    });

  });

});