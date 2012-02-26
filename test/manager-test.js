var Manager = require("../lib/assembly/manager").Manager,
    util = require('utile'),
    should = require('should'),
    fs = require("fs");

describe("Assembly Manager", function() {
  var manager;

  before(function() {
    manager = new Manager({src: __dirname + "/fixtures", dest : __dirname + "/build"});
  });

  after(function(done) {
    fs.unlink(manager.dest, function(){done();});
  });

  it('should output node_modules to vendor', function() {
    var dest = manager._destFile("/home/user/code/node/assembly/node_modules/underscore/underscore.js");
    dest.should.eql(manager.dest + "/vendor/underscore/underscore.js");
  });  

  it('should output libs from vendor to build/vendor', function() {
    var dest = manager._destFile("/Users/user/Code/node/assembly/vendor/handlebars.runtime.js");
    dest.should.eql(manager.dest + "/vendor/handlebars.runtime.js");
  });

  it('should output src file to dest', function() {
    var dest = manager._destFile(manager.src +"/foo.js");
    dest.should.eql(manager.dest + "/foo.js");
  });

});