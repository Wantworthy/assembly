Backbone = require('backbone')
$ = require('jquery')
template = require("../templates/todo")

class TodoView extends Backbone.View
  className : "todo-view"

  render: ->
    self = this
    # Template
    this.$el.html template({message : "make awesome example"})

    return this
  
module.exports = TodoView