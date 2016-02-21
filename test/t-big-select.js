var db3 = require('../index.js');
var fs  = require('fs');


var config = {
  driver   : 'sqlserver',
  host     : '192.168.7.22',
  port     : 1433,
  user     : 'sa',
  password : 'sa',
  database : 'eeb'
};


var pool = db3.create_conn_pool(config, 1, 3, 2000);


pool.get(function(err, conn) {
  console.log('create conn from pool', err || '');

  if (conn) {
    var sql = 'select * from Table_1';
    var a = 0, b, count = 0;

    conn.query('select * from Table_1', function(query) {
      show(query, function() {
        console.log('over ', new Date());
        process.exit(0);
      });
    });
  }
});



function show(query, next) {
  var i = 1;

  query.onMeta(function(m) {
    // console.log('meta', m);
    console.log('begin', new Date());
  });

  query.onData(function(d) {
    if (++i % 10000 === 0) {
      console.log('count', i, new Date());
    }
    // console.log('data', d);
  });

  query.onErr(function(e) {
    console.log('error', e);
  });

  query.onEnd(function() {
    next && next();
  });
}