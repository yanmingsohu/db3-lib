var jfact = require('java-factory-lib');
var index = require('../index.js');
var java = require('java');
jfact.setJavaInstance(java);

console.log(java.classpath);

require('./mysql-base.js');
require('./t-for.js');
require('./t-factory.js');
require('./t-h2l.js');
require('./t-pool.js');
require('./t-java.js');
require('./t-bigdata.js');
require('./t-big-select.js');
require('./t-insert.js');
