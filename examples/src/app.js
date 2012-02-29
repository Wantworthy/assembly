var name = require("./foo").name;

console.log("foo's name is.....", name);
exports.app = {
  foo : "moar...",
  name : name
};