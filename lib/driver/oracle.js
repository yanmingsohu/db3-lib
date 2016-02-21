var bridge = require('../node-java-db-bridge.js');
var util   = require('util');


module.exports.createDriver = createDriver;


//
// Oracle SID 通过 conf.database 传递
//
function createDriver(conf) {

  //// ////
  // oracle 连接的方式:
  //
  // Oracle JDBC Thin using a ServiceName: 
  // jdbc:oracle:thin:@//<host>:<port>/<service_name> 
  //
  // Oracle JDBC Thin using an SID: 
  // jdbc:oracle:thin:@<host>:<port>:<SID> 
  //
  // Oracle JDBC Thin using a TNSName: 
  // jdbc:oracle:thin:@<TNSName> 
  //// /--/

  var driverName = 'oracle.jdbc.OracleDriver';
  var format     = 'jdbc:oracle:thin:@%s:%d:%s';
  var url        = util.format(format, conf.host, conf.port || 1521, conf.database);

  return bridge.createDriver(driverName, 
                             url, 
                             conf);
}