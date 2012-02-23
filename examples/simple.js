var assembly = require("../lib/assembly");

var opts = {src : __dirname + "/src", out: __dirname +"/build"};

assembly.start(opts);

console.log("monitoring dir:", opts.src);