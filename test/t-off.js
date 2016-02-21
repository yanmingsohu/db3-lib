var lib = require('../index.js');
var cp  = require('child_process');
var fs  = require('fs');

var conf = {
  tmpdir : __dirname + '/tmpdir',
  driver   : 'mysql',
  host     : 'localhost',
  port     : '3306',
  user     : 'root',
  password : 'root',
  database : 'test',
};

// t_readline(__filename);
// t_readline(__dirname + '/bigdata.sql');
t_offline();


function t_offline() {
  var off = lib.offline(conf);
  var count = 0;
  var timid = setInterval(push_data, 100);

  // lib.set_work_thread(1000)

  off.on('error', function(err) {
    console.log('Has err', err);
  });

  off.on('wover', function(inf) {
    console.log('任务完成:', inf.pid, ', 写出数据行:', inf.count);
  });

  off.on('wbegin', function(inf) {
    console.log('进程启动:', inf.pid, ', 待处理数据行:', inf.count);
  });

  off.on('retry', function(inf) {
    console.log('重试, 进程:', inf.pid,
                '重试次数:', inf.recont, '出错原因:', inf.err,
                'DB配置:', inf.dbconfig);
  });

  function push_data() {
    for (var i=0; i<1000; ++i) {
      off.update("INSERT INTO t1 (a,b,c) VALUES (" + (++count) + ", 'hello', '\noffline')");
    }
    if (count > 40 * 1000) {
      console.log('over!!');
      clearInterval(timid);
      off.end();
    } else {
      console.log('write data:', count);
    }
  }
}


function t_readline(filename) {
  var fd = fs.openSync(filename, 'r');
  lib.read_line(fd, function(line, str, next) {
    console.log(" ", line, "\t", str);
    next();
  }, function() {
    console.log("end")
    process.exit(0);
  });
}

'<132323>'