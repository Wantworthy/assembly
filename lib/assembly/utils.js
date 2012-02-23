
var utils = module.exports;

utils.load = function (module) {
  try {
    //
    // Attempt to require module.
    //
    return require(module);
  } catch (ex) {
    console.warn('assembly.plugins.'+ module +' requires the `'+module+'` module from npm');
    console.warn('install using `npm install `.' + module);
    console.trace();
    process.exit(1);
  }
};