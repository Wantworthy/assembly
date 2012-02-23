var assembly = require("../lib/assembly");

var opts = {src : __dirname + "/src", out: __dirname +"/build"};

var assembler = assembly.start(opts);
assembler.use(assembly.compilers.coffee);
assembler.use(assembly.compilers.less);
assembler.use(assembly.compilers.hbs);

console.log("monitoring dir:", opts.src);
assembler.rebuild();