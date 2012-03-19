var Worker = require("../lib/assembly/worker").Worker,
    TestHelper = require("./test-helper"),
    util = require('utile'),
    should = require('should'),
    mime = require('mime'),
    fs = require("fs");

describe("Worker", function() {
  var worker,
      mockCompiler = {mimeType: "application/javascript"};

  beforeEach(function() {
    worker = new Worker(TestHelper.mockApp());
  });

  describe('register compiler', function(){
    it("should register processor for coffeescripts", function(){
      worker.registerCompiler(".coffee", mockCompiler);

      worker.compilers.should.have.property('.coffee');
      worker.compilers[".coffee"].should.equal(mockCompiler);
    });
    
    it("should register mimetype of application/javascript for coffee extension", function(){
      worker.registerCompiler(".coffee", mockCompiler);

      mime.lookup('app.coffee').should.equal("application/javascript"); 
    }); 

    it("should lookup compiler for given filename", function(){
      worker.registerCompiler(".coffee", mockCompiler);

      worker.compilerFor("blah.coffee").should.equal(mockCompiler); 
    });    

    it("should update core extensions when mimetype if application/javascript", function(){
      worker.registerCompiler(".coffee", mockCompiler);

      worker.core.extensions.should.include('.coffee'); 
    });

  });

  describe("Compile", function() {

    it("should compile file with mock coffee compiler", function(done){
      var mockCoffeeCompiler = {mimeType: "application/javascript", compile: function(filename, data,cb){
        filename.should.equal(TestHelper.testSrcDir + "/coffee/compiler.coffee");
        
        done();
      }};

      worker.registerCompiler(".coffee", mockCoffeeCompiler);

      worker.compile(TestHelper.testSrcDir + "/coffee/compiler.coffee");
    });    

    it("should invoke callback for image as a buffer", function(done){
      worker.compile(TestHelper.testSrcDir + "/images/cathat.jpg", function(err, data){
        Buffer.isBuffer(data).should.be.true;
        done();
      });
    });

  });

  describe("register processors", function() {

    it("should register a single processor for mime type", function(){ 
      worker.registerProcessor("application/javascript", {});

      worker.processorsFor("foo.js").should.have.lengthOf(1);
    });

    it("should register multiple processors for mime type", function(){ 
      worker.registerProcessor("application/javascript", {} );
      worker.registerProcessor("application/javascript", {} );

      worker.processorsFor("foo.js").should.have.lengthOf(2);
    });

  });

  describe("process", function() {
    
    it("should process source with single processor", function(done){
      var mockProcessor = { process: function(filename, src) {
        filename.should.equal("app.js");
        src.should.equal('var x="bob";');
      }};

      worker.registerProcessor("application/javascript", mockProcessor);

      worker.process("app.js", 'var x="bob";', done);
    });

    it("should invoke callback with passed in source when no processor for file type exists", function(done){
      var imgBuffer = new Buffer("blah");

      worker.process("hat.jpg", imgBuffer, function(err, src){
        src.should.equal(imgBuffer);
        done();
      });
    });

  });
});