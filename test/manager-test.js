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
});