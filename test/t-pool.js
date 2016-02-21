var db3 = require('../index.js');

var config = {
  driver   : 'h2local',
  host     : null,
  port     : 0,
  user     : 'sa',
  password : '1234',
  database : 'test'
};


var pool = db3.create_conn_pool(config, 1, 3, 2000);

for (var i=0; i<5; ++i) {
  pool.get(function(err, conn) {
    console.log('create conn from pool', err || '');

    if (conn) {
      conn.query('select 1', function(query) {
        show(query, function() {
          console.log('- Pool state:', pool.state())
          conn.end();
          console.log('+ Pool state:', pool.state());
        })
      });
    }
  });
}


pool.get(function(err, conn) {
  setTimeout(function() {
    console.log('last conn free');
    conn.end();
  }, 8*1000);
});


var tid = setInterval(function() {
  var s = pool.state();
  console.log('Pool state:', s);

  if (s.sleep == 1) {
    console.log('wait conn free....');
    pool.end(function(err) {
      if (err) return console.log(err);
      clearInterval(tid);
      console.log('All free....', pool.state());
    });
  }
}, 1000);


function show(query, next) {
  query.onMeta(function(m) {
    console.log('meta', m);
  });

  query.onData(function(d) {
    console.log('data', d);
  });

  query.onErr(function(e) {
    console.log('error', e);
  });

  query.onEnd(function() {
    next && next();
  });
}