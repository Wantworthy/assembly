var assembly = require("../lib/assembly"),
    express = require('express'),
    server = express.createServer();

var assembler = assembly.start({src : __dirname + "/src", dest: __dirname +"/build"});
assembler.use(assembly.processors.amdify);
assembler.use(assembly.processors.pathify);

server.use(express.static(assembler.dest));
server.listen(8080, '0.0.0.0', function() {
  console.log("starting up server on localhost:8080");
});

assembler.rebuild();