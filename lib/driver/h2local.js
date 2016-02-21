var bridge = require('../node-java-db-bridge.js');
var util   = require('util');
var plib   = require('path');


module.exports.createDriver = createDriver;


function createDriver(conf) {

  if (!conf.user) conf.user = 'sa';

  //
  // 强制加密数据库文件
  //
  if (!conf.password) {
    conf.password = 'sa sa';
  }
  else if (conf.password.indexOf(' ') < 0) {
    conf.password = conf.password + ' ' + conf.password;
  }

  var dir        = conf.host || (process.cwd() + '/h2_db_files');
  var path       = plib.join(dir, conf.database);

  var driverName = 'org.h2.Driver';
  var format     = 'jdbc:h2:file:%s;CIPHER=AES;';
  var url        = util.format(format, path);


  return bridge.createDriver(driverName,
                             url, 
                             conf);
}