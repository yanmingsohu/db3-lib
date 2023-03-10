var jfact = require('java-factory-lib');
jfact.loadjar(__dirname + '/jar/');
jfact.loadjar(__dirname + '/select-bridge/bin/');


module.exports = require('./lib/factory.js');
module.exports.initJava = initJava;

		
ext('./lib/types.js');
ext('./lib/pool.js');
ext('./lib/offline.js');
ext('./lib/install.js');



function initJava(java) {
  jfact.setJavaInstance(java);
}


function ext(libpath) {
  var lib = require(libpath);
  for (var n in lib) {
    module.exports[n] = lib[n];
  }
}