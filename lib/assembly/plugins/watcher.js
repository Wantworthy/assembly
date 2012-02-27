var watch = require('watch');

var Watcher = exports;

// todo add option to only monitor certain files
Watcher.attach = function (options) {
  var manager = this;
  manager.events = manager.events || {};

  manager.events.compile = function(file){
    manager.emit("compile", file);
  };

  manager.events.remove = function(file){
    manager.emit("remove", file);
  };
};

Watcher.init = function(done) {
  var manager = this;

  watch.createMonitor(manager.src, function (monitor) {
    manager.monitor = monitor;
    monitor.on("changed", manager.events.compile);
    monitor.on("created", manager.events.compile);
    monitor.on("removed", manager.events.remove);

    done();
  });
};

Watcher.detach = function() {
  var manager = this;

  if(manager.monitor) {
    manager.monitor.removeAllListeners(["changed", "created", "removed"]);
  }

};
