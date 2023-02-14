var db3 = require('../index.js');
var jfact = require('java-factory-lib');
var index = require('../index.js');
var java = require('java');
jfact.setJavaInstance(java);

module.exports = {
  do_db : do_db
};


function do_db(config, sql, next) {
  console.log('=============', config.driver, '=====================================================');

  var driver = db3.createDriver(config);
  var r = 0;
  var total = 3;

  driver.connect(function(err, connect) {
    if (err) {
      console.log("connect err", err);
      process.exit(1);
      return;
    }

    connect.query(sql, function(query) {
      query.onMeta(function(meta) {
        console.log("meta", meta);
      });

      query.onData(function(row) {
        query.pause();
        console.log("row [", r, ']', row);
        if (++r >= total) {
          console.log('[and most rows ...]');
          query.end();
        }
        query.resume();
      });

      query.onEnd(function() {
        console.log('>> End', connect.isClosed());
        connect.end();
        console.log('>> isClosed', connect.isClosed());
        if (next) next();
        else process.exit(0);
      });

      query.onErr(function(err) {
        console.log("Query error", err, err.stack);
        // process.exit(1);
      });
    });
  });
}
