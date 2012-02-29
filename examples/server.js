var assembly = require("../lib/assembly"),
    httpServer = require('http-server');

var assembler = assembly.start({src : __dirname + "/src", dest: __dirname +"/build"});
assembler.use(assembly.processors.amdify);

var server = httpServer.createServer({root: assembler.dest, cache: false});

server.listen(8080, '0.0.0.0', function(){
  console.log("starting up server on localhost:8080");
});

assembler.rebuild();