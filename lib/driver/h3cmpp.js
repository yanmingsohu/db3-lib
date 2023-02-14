var bridge = require('../node-java-db-bridge.js');
var util   = require('util');


module.exports.createDriver = createDriver;


function createDriver(conf) {

  var driverName = 'com.MPP.jdbc.Driver';
  var format     = 'jdbc:mpp://%s:%d/%s';
  var url        = util.format(format, conf.host, conf.port || 5258, conf.database);

  return bridge.createDriver(driverName,
                             url,
                             conf);
}
