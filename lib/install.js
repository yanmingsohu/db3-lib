
module.exports = {
  install    : install,
  format_sql : format_sql,
  installAll : installAll,
};


function installAll(conf, arr, allow_alert_fail, allow_sql_fail) {
  if (!conf) throw new Error('conf not allow null');
  var db3 = require(__dirname + '/../');
  
  try {
    var jfact = require('java-factory-lib');
    var java = require('java');
    jfact.setJavaInstance(java);
  } catch(e) {
    console.warn('JDBC not allow,', e.message);
  }
  
  var driver = db3.createDriver(conf);
  driver.connect(function(err, connect) {
    if (err) {
      console.error(err);
      console.error('cannot connect db, install exit 2');
      process.exit(2);
    } else {
      console.log('Connected DB:', conf.driver, conf.host);
      install(connect, arr, function(err, next, sql) {
        while (err) {
          var isAlter = sql.toLowerCase().indexOf('alter') >= 0;
          if (isAlter && allow_alert_fail) {
            console.warn('\nskip alert error');
            break;
          } else {
            console.error('\ngot error, install exit', 4);
            process.exit(4);
          }
          
          if (allow_sql_fail) {
            console.warn('\nskip sql error');
            break;
          } else {
            console.error('\ngot error, install exit', 3);
            process.exit(3);
          }
        }
      
        if (next) {
          next();
        } else {
          console.log('All sql over.');
        }
      });
    }
  });
}


function install(connect, ddl_arr, cb) {
  var i = -1;
  loop();

  function loop() {
    if (++i >= ddl_arr.length) {
      connect.end();
      cb();
      return;
    }

    var sql = format_sql( ddl_arr[i] );

    update(sql, connect, function(err, data, meta) {
      console.log("\n>>>>> SQL: \n", sql);
      if (err) {
        console.log("!*!", err.message);
        for (var n in err) {
          if (n == 'stack') continue;
          console.log('   ', n + ':', err[n]);
        }
        
        return cb(err, loop, sql);
      } else {
        console.log("---", data, meta || '');
      }
      loop();
    });
  }
}


//
// 执行一个 sql 返回原始数据
// !! limit 默认为 20 [不再使用]
//
// _RCB: Function(err, data, meta)
// meta:
// data:
//
function update(sql, connect, _RCB, limit) {
  // console.log('QUERY:', sql);

  function RCB(err, data, meta) {
    _RCB && _RCB(err, data, meta);
    _RCB = null;
  }

  connect.query(sql, function(query) {
    var meta = null, data = [];

    query.onMeta(function(_meta) {
      meta = _meta;
    });

    query.onData(function(row) {
      data.push(row);
    });

    query.onEnd(function() {
      RCB(null, data, meta);
    });

    query.onErr(function(err) {
      RCB(err);
    });
  });
}


function format_sql(_in) {
  var TAB_CH = '  ';
  var out    = [];
  var sp     = 0;
  var tab    = 0;

  for (var i=0, e=_in.length; i < e; ++i) {
    var c = _in[i];
    if (c == "\n") { continue; }
    if (c == "\t") { c = ' '; }
    if (c == ' ') {
      if (++sp > 1) { continue; }
    } else { sp = 0; }

    out.push(c);

    if (c == ',') {
      out.push("\n");
      push_tab();
    } else if (c == '(') {
      var ss = _in.indexOf(')', i);
      if ((ss >=0) && (ss - i > 8)) {
        out.push("\n");
        ++tab;
        push_tab();
      }
    }
  }

  function push_tab() {
    for (var i=tab; i>0; --i) {
      out.push(TAB_CH);
    }
  }

  return out.join('');
}