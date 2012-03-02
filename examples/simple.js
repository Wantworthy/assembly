var assembly = require("../lib/assembly");

var opts = {src : __dirname + "/src", dest: __dirname +"/build"};

var assembler = assembly.createAssembler({src : __dirname + "/src", dest: __dirname +"/build"});
assembler.use(assembly.processors.amdify);
assembler.start();

console.log("monitoring dir:", opts.src);