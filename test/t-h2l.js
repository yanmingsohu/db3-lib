var db3 = require('../index.js');
var tool = require('./t-tools.js');

var config = {
  driver   : 'h2local',
  host     : null,
  port     : 0,
  user     : 'sa',
  password : '1234',
  database : 'test'
};

var create = 'CREATE TABLE TEST(ID INT PRIMARY KEY, NAME VARCHAR(255))';
var select = 'select * from TEST';
var insert = "insert into TEST (ID, NAME) values (3, 'hello'), (4, 'world')";
var count  = 'select count(*) as total from TEST';


tool.do_db(config, count, function() {
  // tool.do_db(config, select);
});  

