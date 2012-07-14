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

  describe("Amdify define", function(){
    it("should amdify script with 1 require", function(done) {
      var foo = TestHelper.fixture("app.js");

      var src = amdify.process(TestHelper.testSrcDir +"/app.js", foo);
      src.should.eql(TestHelper.fixture("amd/expected.js"));
      done();
    });

    it("should amdify coffeescript compiled code", function(done) {
      var coffee = TestHelper.fixture("/amd/coffee_out.js");

      var src = amdify.process(TestHelper.testSrcDir +"/amd/coffee_out.js", coffee);
      src.should.eql(TestHelper.fixture("amd/coffee_out_expected.js"));
      done();
    });
  });

  describe("Module ID", function() {

    it("should return module id for nested file", function() {
      var id = amdify._moduleID(core.src + "/blah/foo.js");

      id.should.equal("blah/foo");
    });

    it("should return module id for vendored file", function() {
      var id = amdify._moduleID(core.jsRoot + "/vendor/handlebars.runtime.js");

      id.should.equal("js/vendor/handlebars.runtime");
    });

    it("should return module id for file within node_modules", function() {
      var id = amdify._moduleID("/users/dude/code/assembly/node_modules/underscore.js");

      id.should.equal("js/vendor/underscore");
    });
  });

  describe("Dependencies", function() {

    it("should return single dependency", function() {
      var deps = amdify._dependencies(core.src + "/app.js", TestHelper.fixture("app.js"));
      deps.should.eql(['require', 'module', 'exports', './foo']);
    });    

    it("should return multiple deps", function() {
      var deps = amdify._dependencies(core.src + "/app.js", "var faker = require('./lib/fake');");
      deps.should.eql(['require', 'module', 'exports', './lib/fake']);
    });

  });

  describe("Is Common JS", function(){
    it("should return true for simple source with export statment", function() {

      var isCommon = amdify.isCommonJS('exports.foo = "bar";');

      isCommon.should.be.true;
    });    

    it("should return true for handlebars templates", function() {

      var isCommon = amdify.isCommonJS('var Handlebars = require("vendor/handlebars.runtime");');

      isCommon.should.be.true;
    });

    it("should return true for simple source with require statment", function() {
      var isCommon = amdify.isCommonJS('var bob=require("bob");');

      isCommon.should.be.true;
    });

    it("should return true for simple app.js source", function() {
      var isCommon = amdify.isCommonJS(TestHelper.fixture("app.js"));

      isCommon.should.be.true;
    });

    it("should return false for jquery source", function() {
      var jquery = TestHelper.fixture("js/vendor/jquery.js");
      var isCommon = amdify.isCommonJS(jquery);

      isCommon.should.be.false;
    });

    it("should return true for underscore source", function() {
      var underscore = fs.readFileSync(require.resolve('underscore'), "utf-8");
      var isCommon = amdify.isCommonJS(underscore);

      isCommon.should.be.true;
    });

  });

});