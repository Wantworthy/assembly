var TestHelper = require("../test-helper"),
    LessCompiler = require("../../lib/assembly/compilers/less").LessCompiler,
    util = require('util'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("Less Compiler", function() {
  var compiler;
  beforeEach(function(){
    compiler = new LessCompiler({}, {});
  });

  it('should compile simple less file', function() {
    compiler.compile(TestHelper.testSrcDir + "/less/style.less", TestHelper.fixture("/less/style.less"), function(err, data) {
      data.should.equal(TestHelper.fixture("/less/style.css"));
    });
  });

  it('should handle relative import', function() {
    compiler.compile(TestHelper.testSrcDir + "/less/import.less", TestHelper.fixture("/less/import.less"), function(err, data) {
      data.should.equal(TestHelper.fixture("/less/style.css"));
    });
  });

});