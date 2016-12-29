var db3 = require(__dirname + '/../');

var options = {
  'driver': 'mysql',
  'host': 'localhost',
  'user': 'root',
  'password': 'root',
  'database': 'test',
};


var arr = [
  "CREATE TABLE IF NOT EXISTS a1 (id int, name VARCHAR(32))",
  "CREATE TABLE IF NOT EXISTS a2 (id int, name VARCHAR(32))",
  "CREATE TABLE IF NOT EXISTS a3 (id int, name VARCHAR(32))",

  "ALTER TABLE `a1` ADD COLUMN `time` DATETIME ",
];

db3.installAll(options, arr, true);
