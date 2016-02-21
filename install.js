var cp    = require('child_process');
var jfact = require('java-factory-lib');

var src = __dirname + '/select-bridge/src/';
var bin = __dirname + '/select-bridge/bin/';


jfact.compile(src, bin, function(err, msg) {
  if (err) {
    process.exit(-1);
  } else {
    console.log(msg);
  }
});