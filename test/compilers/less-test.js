var TestHelper = require("../test-helper"),
    lesscompiler = require("../../lib/assembly/compilers/less"),
    util = require('util'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("Less Compiler", function() {
  it('should compile simple less file', function() {
    lesscompiler.compile(TestHelper.testSrcDir + "/less/style.less", TestHelper.fixture("/less/style.less"), function(err, data) {
      data.should.equal(TestHelper.fixture("/less/style.css"));
    });
  });

  it('should handle relative import', function() {
    lesscompiler.compile(TestHelper.testSrcDir + "/less/import.less", TestHelper.fixture("/less/import.less"), function(err, data) {
      data.should.equal(TestHelper.fixture("/less/style.css"));
    });
  });

});