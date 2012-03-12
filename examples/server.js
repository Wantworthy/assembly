var assembly = require("../lib/assembly"),
    express = require('express'),
    server = express.createServer();

var assembler = assembly.createAssembler({src : __dirname + "/src", dest: __dirname +"/build"});
assembler.use(assembly.processors.pathify);
assembler.use(assembly.processors.amdify);
// assembler.use(assembly.plugins.gzip);
assembler.start();

server.use(assembler.server());
server.use(express.static(assembler.dest));
server.listen(8080, '0.0.0.0', function() {
  console.log("starting up server on localhost:8080");
});