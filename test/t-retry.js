var db3 = require('../index.js');
var fs  = require('fs');


var config = {
  driver   : 'mysql',
  host     : '192.168.7.21',
  port     : '33066',
  user     : 'connuser',
  password : 'dalianzhirong321_A',
  database : 'a297dfacd7a84eab9656675f61750078',
  sql      : 'select * from test limit 10'
};

// Cannot enqueue Query after fatal error
var driver = db3.createDriver(config);

driver.connect(function(err, connect) {
  console.log(err || 'connect');

  do1();

  function do1() {
    connect.query('select 1', function(query) {
      query.onMeta(cp('meta'));
      query.onData(cp('data'));
      query.onEnd(cp('end', do2));
      query.onErr(cp('err'));
    });
  }

  function do2() {
    console.log('state:', connect.isClosed())
    // Cannot enqueue Query after invoking quit
    connect.end(do3);
  }

  function do3() {
    console.log('state:', connect.isClosed())
    connect.query('select 2', function(query) {
      query.onMeta(cp('meta'));
      query.onData(cp('data'));
      query.onEnd(cp('end'));
      query.onErr(cp('err'));
    })
  }
});


function cp(name, next) {
  return function(d) {
    console.log(name, d||'');
    next && next();
  };
}