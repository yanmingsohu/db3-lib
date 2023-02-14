var db3 = require('../index.js');
var tool = require('./t-tools.js');

var config = {
  driver   : 'h3cmpp',
  host     : '192.168.10.80',
  port     : 0,
  user     : 'mpp',
  password : 'h3c',
  database : 'test',
  properties : {
    hostList : '192.168.10.80,192.168.10.81',
    failoverEnable: true,
  },
};

var create = 'CREATE TABLE TEST(ID INT PRIMARY KEY, NAME VARCHAR(255))';
var select = 'select * from q1';
var insert = "insert into TEST (ID, NAME) values (3, 'hello'), (4, 'world')";
var count  = 'select count(*) as c from q1';


tool.do_db(config, count, function() {
  tool.do_db(config, select);
});
