var bridge = require('../node-java-db-bridge.js');
var util   = require('util');


module.exports.createDriver = createDriver;


function createDriver(conf) {

  var driverName = 'com.microsoft.sqlserver.jdbc.SQLServerDriver';
  var format     = 'jdbc:sqlserver://%s:%d; DatabaseName=%s';
  var url        = util.format(format, conf.host, conf.port || 1433, conf.database);


  return bridge.createDriver(driverName,
                             url, 
                             conf);
}