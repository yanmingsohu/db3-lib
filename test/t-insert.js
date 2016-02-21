var db3 = require('../index.js');


var config = [
{
  driver   : 'mysql',
  host     : '192.168.7.21',
  port     : '33066',
  user     : 'connuser',
  password : 'dalianzhirong321_A',
  database : 'a297dfacd7a84eab9656675f61750078',
  sql      : 'insert into test111(name) values (' + Date.now() + ')'
},
{
  driver   : 'oracle',
  host     : '192.168.7.22',
  port     : '1521',
  user     : 'eeb',
  password : 'zhirong',
  database : '',
  sql      : 'insert into NEWTABLE6_5(col1) values (1)'
},
{
  driver   : 'sqlserver',
  host     : '192.168.7.22',
  port     : '1433',
  user     : 'sa',
  password : 'sa',
  database : 'eeb',
  sql      : "insert into Table_1(c1) values (1)"
}
];


var i = -1;
loopconfig();

// i = 1;
// do_db(config[i], config[i].sql);


function loopconfig() {
  var len = config.length;
  if (++i < len) {
    do_db(config[i], config[i].sql, loopconfig);
  } else {
    i = -1;
    console.log("\n!!!!!!!!!!!!!!!!!!!!! All over.");
    // process.exit(0);
  }
}


// mysql 在调用 query.end() 之后如何还有没处理的数据会抛出异常
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ', err, err.stack);
});



function do_db(config, sql, next) {
  console.log('=======================', config.driver, '==========================');

  var driver = db3.createDriver(config);
  var r = 0;
  var total = 3;
  

  driver.connect(function(err, connect) {
    if (err) {
      console.log("connect err", err);
      process.exit(1);
      return;
    }

    connect.update(sql, function(err, arows) {
      console.log('update over1', config.driver, err || arows);

      connect.update(sql, function(err, arows) {
        console.log('update over2', config.driver, err || arows);
        next();
      });
    });
  });
}