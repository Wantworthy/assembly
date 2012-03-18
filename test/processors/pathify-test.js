var Pathify = require("../../lib/assembly/processors/pathify").Pathify,
    assembly = require("../../lib/assembly"),
    TestHelper = require("../test-helper"),
    util = require('utile'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("Pathify Processor", function() {
  var core = TestHelper.core,
      pathify;

  beforeEach(function(){
    pathify = new Pathify(core);
  });

  it("should update require for relative require at base path", function(){
    var out = pathify.process(core.src +"/foo.js", 'var app = require("./app");');

    out.should.equal('var app = require("app");');
  });  

  it("should update require array to correct paths", function() {
    var out = pathify.process(core.src +"/foo.js", 'require(["./app", "./nested/baz"], function(app, baz){});');
    out.should.equal('require([ "app", "nested/baz" ], function(app, baz) {});');
  });

  it("should update require for lib", function(){
    var out = pathify.process(core.src +"/foo.js", 'var app = require("handlebars.runtime");');

    out.should.equal('var app = require("js/vendor/handlebars.runtime");');
  });

  it("should update require for sibling and parent require ", function(){
    var out = pathify.process(core.src +"/nested/foo.js", 'var app = require("../app"), baz = require("./baz");');

    out.should.equal('var app = require("app"), baz = require("nested/baz");');
  });

  it("should update require for nested require ", function() {
    var out = pathify.process(core.src +"/foo.js", 'var baz = require("./nested/baz")');

    out.should.equal('var baz = require("nested/baz");');
  });

  it("should not do anything when require is already at the correct full path ", function() {
    var out = pathify.process(core.src +"/foo.js", 'var app = require("app")');

    out.should.equal('var app = require("app");');
  });

  it("should handle dot requires", function() {
    var out = pathify.process(core.src +"/foo.js", 'var name = require("./nested/baz").name');
    out.should.equal('var name = require("nested/baz").name;');
  });

  it("should handle crazyness", function() {
    var out = pathify.process(core.src +"/foo.js", '(function () {require("./nested/baz");})();');
    out.should.equal('(function() {\n    require("nested/baz");\n})();');
  });

  it("should update define to dest path", function() {
    var out = pathify.process(core.jsRoot +"/vendor/jquery.js", 'define( "jquery", [], function () { return jQuery; } );');
    out.should.equal('define("js/vendor/jquery", [], function() {\n    return jQuery;\n});');
  });

  it("should update define dependency paths", function() {
    var out = pathify.process(core.jsRoot +"/vendor/backbone.js", "define(['underscore', 'jquery', 'exports'], function(_, $, exports) {});");
    out.should.eql('define([ "js/vendor/underscore", "js/vendor/jquery", "exports" ], function(_, $, exports) {});');    
  });  

  it("should update define with name and dependencies paths", function() {
    var out = pathify.process(core.jsRoot +"/vendor/backbone.js", "define('backbone', ['underscore', 'jquery', 'exports'], function(_, $, exports) {});");
    out.should.eql('define("js/vendor/backbone", [ "js/vendor/underscore", "js/vendor/jquery", "exports" ], function(_, $, exports) {});');    
  });  

  it("should not update defined keyword dependencies", function() {
    pathify.keywords.forEach(function(f){fs.writeFileSync(core.jsRoot +"/vendor/" + f +".js");});

    var out = pathify.process(core.jsRoot +"/vendor/backbone.js", 'define("app", ["require", "module", "exports"], function(require, module, exports) {});');
    out.should.equal('define("app", [ "require", "module", "exports" ], function(require, module, exports) {});');

    pathify.keywords.forEach(function(f){fs.unlinkSync(core.jsRoot +"/vendor/" + f +".js");});
  });

});