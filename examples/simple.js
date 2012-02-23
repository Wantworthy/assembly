var assembly = require("../lib/assembly");

var opts = {src : __dirname + "/src", out: __dirname +"/build"};

var assembler = assembly.start(opts);

console.log("monitoring dir:", opts.src);
assembler.rebuild();