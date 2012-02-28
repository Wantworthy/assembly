var watcher = require("../../lib/assembly/plugins/watcher"),
    TestHelper = require("../test-helper"),
    util = require('utile'),
    should = require('should'),
    fs = require("fs"),
    path = require('path');

describe("Watcher Plugin", function() {
  var app,
      tempFile = TestHelper.testSrcDir + "/temp.js";

  before(function(done) {
    app = TestHelper.mockApp();
    app.use(watcher);
    app.init(done);
  });

  afterEach(function(done){
    if(path.existsSync(tempFile)) {
      return fs.unlink(tempFile, done);
    }

    done();
  });

  it("should emit compile event when file is created", function(done) {
    this.timeout(0);

    app.once("compile", function(filename) {
      filename.should.equal(tempFile);
      done();
    });

    fs.writeFileSync(tempFile, "testing.....");
  });

  it("should emit compile event when file is modified", function(done) {
    this.timeout(0);
    var now = new Date().getTime();

    fs.writeFileSync(tempFile, "testing.....");

    app.once("compile", function(filename) {
      filename.should.equal(tempFile);
      done();
    });

    fs.utimesSync(tempFile, now, now);
  });

  it("should emit remove event when file is deleted", function(done) {
    this.timeout(0);
    fs.writeFileSync(tempFile, "testing.....");

    app.once("remove", function(filename) {
      filename.should.equal(tempFile);
      done();
    });

    fs.unlinkSync(tempFile);
  });

});