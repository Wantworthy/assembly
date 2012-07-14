var $ = require('jquery'),
    backbone = require('backbone'),
    template = require('templates/world'),
    hbarsTemplate = require('./templates/hello'),
    name = require("./foo").name,
    Animals = require("./animals"),
    TodoView = require("./ui/todo-view"),
    config = require("./config");

console.log("foo's name is.....", name);
console.log("backbone version is", backbone.VERSION);
console.log("Config is: " + JSON.stringify(config));

var sam = new Animals.Snake("Sammy the Python");
var tom = new Animals.Horse("Tommy the Palomino");

sam.move();
tom.move();

exports.app = {
  foo : "moar...",
  name : name,
  template : template,
  hbarsTemplate : hbarsTemplate
};

$("#todos").html(new TodoView().render().el);