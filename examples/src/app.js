var name = require("./foo").name;

var backbone = require('backbone');

console.log("foo's name is.....", name);
console.log("backbone version is", backbone.VERSION);
exports.app = {
  foo : "moar...",
  name : name
};