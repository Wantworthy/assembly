var Amdify = require("../../lib/assembly/processors/amdify").Amdify,
    assembly = require("../../lib/assembly"),
    TestHelper = require("../test-helper"),
    util = require('utile'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("Amdify Processor", function() {
  var core = TestHelper.core,
      amdify;

  before(function() {
    amdify = new Amdify(core);
  });

  it("should amdify script with 1 require", function(done) {
    var foo = TestHelper.fixture("app.js");

    var src = amdify.process(TestHelper.testSrcDir +"/app.js", foo);
    src.should.eql(TestHelper.fixture("amd/expected.js"));
    done();
  });

  describe("Module ID", function() {

    it("should return module id for nested file", function() {
      var id = amdify._moduleID(core.src + "/blah/foo.js");

      id.should.equal("blah/foo");
    });

    it("should return module id for vendored file", function() {
      var id = amdify._moduleID(core.src + "/vendor/handlebars.runtime.js");

      id.should.equal("vendor/handlebars.runtime");
    });

    it("should return module id for file within node_modules", function() {
      var id = amdify._moduleID("/users/dude/code/assembly/node_modules/underscore.js");

      id.should.equal("vendor/underscore");
    });
  });

  describe("Dependencies", function() {

    it("should return single dependency", function(){
      var deps = amdify._dependencies(TestHelper.fixture("app.js"));
      deps.should.eql(['require', 'module', 'exports', 'foo']);
    });

  });

});