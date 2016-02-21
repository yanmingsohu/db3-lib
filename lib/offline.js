var fs    = require('fs');
var cp    = require('child_process');
var uuid  = require('uuid-zy-lib');
var Event = require('events').EventEmitter;
var task  = require('./easy-task.js');

var INTERVAL_TIME = 15;
var CACHE_SIZE    = 15000;
var MAX_THREAD    = 3;
var RETRY_WAIT    = 15 * 1000;
var opened_files  = {};


module.exports = {
  offline         : offline,
  read_line       : read_line,
  set_work_thread : set_work_thread,
};


if (!module.parent) {
  processor();
} else {
  process.on('exit', _del_cache_file);
  process.on('SIGINT', function() {
    _del_cache_file();
    process.exit(0);
  });
}


function set_work_thread(t) {
  if (t > 1 && t < 100) {
    MAX_THREAD = t;
  } else {
    throw new RangeError('work thread must 1<x<100');
  }
}


function _del_cache_file() {
  for (var fn in opened_files) {
    try { fs.unlinkSync(fn); } 
    catch(e) {}
    delete opened_files[fn];
  }
}


//
// 所有对数据库的写出到一个队列中
// 当队列满时, 再启动一个新的进程进行批量写入
// 每个数据库只需要一个这样的对象
// config -- 数据库连接配置, config.tmpdir 保存临时文件的目录
//
function offline(config) {
  if (!config.tmpdir) {
    throw new Error('must set tmpdir attribute');
  }

  var ret = new Event();
  ret.update = update;
  ret.end = end;

  var fname;
  var cache_file;
  var new_sql;
  var line_num;
  var thread = 0;

  _create_cache_file();


  function _create_cache_file() {
    fname       = config.tmpdir + '/' + uuid.v1();
    cache_file  = fs.openSync(fname, 'w');
    new_sql     = task(INTERVAL_TIME, _start_sql_processor);
    line_num    = 0;
    opened_files[fname] = 1;
  }


  function _start_sql_processor() {
    if (thread >= MAX_THREAD || line_num < 1)
      return;

    new_sql.stop();
    fs.closeSync(cache_file);

    var openfile = fname;
    var argv = ['sql_processor', '-f', fname, '-c', JSON.stringify(config)];
    var child = cp.fork(__filename, argv);

    ret.emit('wbegin', 
      { pid: child.pid, count: line_num });

    child.on('message', function(msg) {
      ret.emit(msg[0], msg[1]);
    });

    child.on('exit', function() {
      --thread;
      delete opened_files[openfile];
    });

    ++thread;
    _create_cache_file();
  }


  //
  // 一条 insert/update sql 语句,
  // 该命令会立即返回, 无法得知是否执行成功
  //
  function update(sql) {
    fs.writeSync(cache_file, '/* ' + line_num + ' */ ');
    fs.writeSync(cache_file, JSON.stringify(sql));
    fs.writeSync(cache_file, "\n");

    new_sql.interrupt();
    if (++line_num >= CACHE_SIZE) {
      _start_sql_processor();
    }
  }


  function end() {
    new_sql.stop();
    new_sql = null;
    fs.closeSync(cache_file);
    fs.unlinkSync(fname);
  }


  return ret;
}


//
// 执行写入操作的进程函数
//
function processor() {
  if (!get_opt('sql_processor', true)) {
    debug('child argv error');
    process.exit(9);
  }

  var filename = get_opt('-f');
  var config   = get_opt('-c');
  var recont   = 0;

  try {
    init_java();

    config   = JSON.parse(config);
    var fd   = fs.openSync(filename, 'r');
    var fact = require('./factory.js');
    var drv  = fact.createDriver(config);
    var connect;

    create_conn();


    function create_conn() {
      drv.connect(function(err, _connect) {
        if (err) return retry(err);
        connect = _connect;
        read_line(fd, line_listener, all_over);
      });
    }


    function line_listener(line, sql, next) {
      try {
        var b = sql.indexOf('*/');
        sql = JSON.parse(sql.substr(b+2));
      } catch(err) {
        emit('error', err);
      }

      connect.update(sql, function(err, arows) {
        if (err) {
          err.sql = sql;
          err.msg = err.message;
          emit('error', err);
        }
        next();
      });
    }


    function all_over(total) {
      emit('wover', 
        { pid: process.pid, count: total });
      end();
    }


    function retry(err) {
      emit('retry',  { pid: process.pid, 
          recont: ++recont, err: err, dbconfig: config });
      setTimeout(create_conn, RETRY_WAIT);
    }

  } catch(err) {
    end(err);
  }

  process.on('exit', function(code) {
    if (filename) end();
  });


  function emit(name, value) {
    process.send([ name, value ]);
  }


  function end(err) {
    if (err) emit('error', err);
    try { fs.unlinkSync(filename); } catch(e) {}
    filename = null;
    process.exit(err ? 1 : 0);
  }
}


//
// 异步读取文件, 把每一行发送给 line_handle`
// line_handle: Function(linenum, str, next)
//
function read_line(fd, line_handle, _end) {
  var BUF_LEN = 256;
  var bufs    = [];
  var en      = "\n".charCodeAt(0);
  var pos     = 0;
  var lnum    = 0;
  var totalch = 0;

  _next();

  function _next() {
    var tmp = new Buffer(BUF_LEN);
    var bytesRead = fs.readSync(fd, tmp, 0, tmp.length, pos);

    if (bytesRead > 0) {
      var notfind = true;
      do {
        for (var i=0, e=bytesRead; i<e; ++i) {
          if (tmp[i] == en) {
            notfind = false;
            pos += i + 1;
            call_line_handle(i);
            break;
          }
        }

        if (notfind) {
          bufs.push(tmp.slice(0, bytesRead));
          pos += bytesRead;
        } else {
          break;
        }

        tmp = new Buffer(BUF_LEN);
        bytesRead = fs.readSync(fd, tmp, 0, tmp.length, pos);
      } while(bytesRead > 0);

      if (notfind) {
        call_line_handle(0);
      }

    } else if (bufs.length > 0) {
      call_line_handle(0);
    } else {
      _end && _end(lnum);
    }

    function call_line_handle(end_pos) {
      var linestr;

      if (bufs.length > 0) {
        end_pos && bufs.push(tmp.slice(0, end_pos));
        linestr = Buffer.concat(bufs).toString('utf8');
        bufs = [];
      } else if (end_pos) {
        linestr = tmp.slice(0, end_pos).toString('utf8');
      }

      if (linestr) {
        totalch += linestr.length;
        setImmediate(function() {
          line_handle(++lnum, linestr, _next);
        });
      }
    }
  }
}


function init_java() {
  var jfact = require('java-factory-lib');
  var index = require('../index.js');
  var java = require('java');
  jfact.setJavaInstance(java);
}


function get_opt(name, _has) {
  for (var i=0, e=process.argv.length; i<e; ++i) {
    if (process.argv[i] == name) {
      if (_has) {
        return true;
      }
      return process.argv[i+1];
    }
  }
}


function debug() {
  console.log.apply(console, arguments);
}