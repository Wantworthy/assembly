var $ = require('jquery'),
    backbone = require('backbone'),
    name = require("./foo").name;

console.log("foo's name is.....", name);
console.log("backbone version is", backbone.VERSION);
exports.app = {
  foo : "moar...",
  name : name
};