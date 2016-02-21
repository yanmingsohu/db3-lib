var db3 = require('../index.js');
var fs  = require('fs');


var config = {
  driver   : 'oracle',
  host     : '192.168.7.22',
  port     : 1521,
  user     : 'eeb',
  password : 'zhirong',
  database : ''
};


var pool = db3.create_conn_pool(config, 1, 3, 2000);


pool.get(function(err, conn) {
  console.log('create conn from pool', err || '');

  if (conn) {
    var sql = fs.readFileSync(__dirname + '/bigdata.sql', {encoding:'utf8'});
    var a = 0, b, count = 0;

    check_sql();

    function check_sql() {
      b = sql.indexOf('\n', a);
      if (b >= 0) {
        setImmediate(function() {
          var _s = sql.substring(a, b);
          a=b+1;
          next_sql(_s);
        });
      } else {
        conn.end();
        console.log("is over.");
      }
    }

    function next_sql(_sql) {
      if (++count % 100 == 0) {
        console.log("DO::", count, _sql);
      }

      conn.query(_sql, function(query) {
        show(query, check_sql);
      });
    }
  }
});



function show(query, next) {
  query.onMeta(function(m) {
    console.log('meta', m);
  });

  query.onData(function(d) {
    // console.log('data', d);
  });

  query.onErr(function(e) {
    console.log('error', e);
  });

  query.onEnd(function() {
    next && next();
  });
}