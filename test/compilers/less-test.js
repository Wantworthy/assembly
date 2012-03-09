var TestHelper = require("../test-helper"),
    LessCompiler = require("../../lib/assembly/compilers/less").LessCompiler,
    util = require('util'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("Less Compiler", function() {
  var compiler;
  beforeEach(function(){
    compiler = new LessCompiler(TestHelper.mockApp(), {});
  });

  describe("Compile", function(){
    it('should not compile simple.less file because it gets imported', function(done) {
      compiler.compile(TestHelper.cssRoot + "/style.less", TestHelper.fixture("/less/style.less"), function(err, data) {
        err.message.should.equal("Skipping compilation of " + TestHelper.cssRoot + "/style.less");
        err.skipped.should.be.true;
        done();
      });
    });

    it('should emit compile event for files that import style.less', function(done) {
      compiler.manager.once("compile", function(lessfile) {
        lessfile.should.equal(TestHelper.cssRoot + "/import.less");
        done();
      });

      compiler.compile(TestHelper.cssRoot + "/style.less", TestHelper.fixture("/less/style.less"), function(err, data) {
      });
    });

    it('should handle relative import', function(done) {
      compiler.compile(TestHelper.testSrcDir + "/less/import.less", TestHelper.fixture("/less/import.less"), function(err, data) {
        data.should.equal(TestHelper.fixture("/less/style.css"));
        done();
      });
    });
  });

  describe("imported by", function() {
    it("should return import.less file which imports it", function(done) {
      compiler.importedBy(TestHelper.cssRoot +"/style.less", function(err, filenames) {
        filenames.should.eql([TestHelper.cssRoot + "/import.less"]);
        done();
      });
    });

    it("should return empty list for import.less", function(done) {
      compiler.importedBy(TestHelper.cssRoot +"/import.less", function(err, filenames) {
        filenames.should.have.length(0);
        done();
      });
    });

    it("should return import.less file for subdir less file", function(done) {
      compiler.importedBy(TestHelper.cssRoot +"/subdir/sub.less", function(err, filenames) {
        filenames.should.eql([TestHelper.cssRoot + "/nested_import.less"]);
        done();
      });
    });

  });
});