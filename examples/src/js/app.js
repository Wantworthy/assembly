var $ = require('jquery'),
    backbone = require('backbone'),
    template = require('templates/world'),
    hbarsTemplate = require('templates/hello'),
    name = require("./foo").name,
    myconfig = require("./myconfig");

console.log("foo's name is.....", name);
console.log("backbone version is", backbone.VERSION);
console.log("Config variable some_key: " + myconfig.some_key);

exports.app = {
  foo : "moar...",
  name : name,
  template : template,
  hbarsTemplate : hbarsTemplate
};