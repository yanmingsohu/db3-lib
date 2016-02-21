var db3 = require('../index.js');
var tool = require('./t-tools.js');

// var sql1 = 'select * from sys_apis limit 10';
// var sql2 = 'select * from test limit 10'

var config = [
{
  driver   : 'mysql',
  host     : '192.168.7.21',
  port     : '33066',
  user     : 'connuser',
  password : 'dalianzhirong321_A',
  database : 'a297dfacd7a84eab9656675f61750078',
  sql      : 'select * from test limit 10'
},
{
	driver   : 'oracle',
  host     : '192.168.7.22',
  port     : '1521',
  user     : 'sys as sysdba',
  password : 'zhirong',
  database : 'XE',
  sql      : 'select * from test'
},{
	driver   : 'sqlserver',
  host     : '192.168.7.22',
  port     : '1433',
  user     : 'sa',
  password : 'sa',
  database : 'model',
  sql      : "select name, type, xtype from sysobjects "
}
];


var i = -1;
loopconfig();

// i = 1;
// do_db(config[i], config[i].sql);


function loopconfig(next) {
	var len = config.length;
	if (++i < len) {
		tool.do_db(config[i], config[i].sql, function() {
      loopconfig(next);
    });
	} else {
    i = -1;
		console.log("\n!!!!!!!!!!!!!!!!!!!!! All over.");
		if (next) next(next);
    else process.exit(0);
	}
}


// mysql 在调用 query.end() 之后如何还有没处理的数据会抛出异常
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});
