define("app", [ "require", "module", "exports", "./foo" ], function(require, module, exports) {
    var foo = require("./foo");
    exports.app = {
        a: "apple",
        b: "baz"
    };
});