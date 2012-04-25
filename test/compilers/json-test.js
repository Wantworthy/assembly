var TestHelper = require("../test-helper"),
    JsonCompiler = require("../../lib/assembly/compilers/json").JsonCompiler,
    util = require('util'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("JsonCompiler", function() {
  var compiler;
  beforeEach(function(){
    var app = TestHelper.mockApp();
    compiler = new JsonCompiler({env:'test'});
  });

  it('should have a working beforeEach', function(done) {
    done();
  });
  describe("Compile", function(){
    it('should only have dev variables', function(done) {
      compiler.compile(TestHelper.jsRoot + "/config.json", TestHelper.fixture("/js/config.json"), function(err, data) {
        if (err) { throw err }
        data.should.include('def');
        data.should.not.include('abc');        
        done();
      });
    });
  });
});