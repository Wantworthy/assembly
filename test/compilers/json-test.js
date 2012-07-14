var TestHelper = require("../test-helper"),
    JsonCompiler = require("../../lib/assembly/compilers/json"),
    util = require('util'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("JsonCompiler", function() {
  beforeEach(function(){
    var app = TestHelper.mockApp();
  });

  describe("Compile", function(){
    it('should only have dev variables', function(done) {
      JsonCompiler.compile(TestHelper.jsRoot + "/config.json", TestHelper.fixture("/js/config.json"), function(err, data) {
        should.not.exist(err);

        data.should.include('def');
        done();
      });
    });
  });
});