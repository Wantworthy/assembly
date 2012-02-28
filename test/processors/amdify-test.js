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

});