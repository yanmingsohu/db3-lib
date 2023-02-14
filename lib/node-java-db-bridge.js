var javadb = require('./java-db.js');
var EventEmitter = require('events').EventEmitter;


module.exports.createDriver = createDriver;


var typemapping = {
  '2003': 'ARRAY',
  '3'   : 'DECIMAL',
  '2'   : 'DECIMAL',
  '5'   : 'SHORT',
  '4'   : 'LONG',
  '6'   : 'FLOAT',
  '8'   : 'DOUBLE',
  '0'   : 'NULL',
  '93'  : 'TIMESTAMP',
  '-5'  : 'LONGLONG',
  '4'   : 'INT24',
  '91'  : 'DATE',
  '92'  : 'TIME',
  '12'  : 'VARCHAR',
  '-9'  : 'NVARCHAR',
  '-7'  : 'BIT',
  '2004': 'BLOB',
  '-2'  : 'BINARY',
  '16'  : 'BOOLEAN',
  '1'   : 'CHAR',
  '-15' : 'NCHAR',
  // '-1'  : 'LONGVARCHAR',
  // '-16' : 'LONGNVARCHAR',
};

//
// 使 java 接口兼容设计接口
//
function createDriver(driverName, url, conf) {
  var driver = {
    connect: connect
  };

  var jdriver = null;


  function connect(rcb) {
    if (jdriver) {
      _connect();
      return;
    }

    javadb.createDriver(driverName, conf.properties, function(err, _driver) {
      if (err) return rcb(err);
      jdriver = _driver;
      _connect();
    });

    function _connect() {
      jdriver.connect(url, conf.user, conf.password, function(err, jconn) {
        if (err) return rcb(err);
        rcb(null, createConnect(jconn));
      });
    }
  }

  return driver;
}


function createConnect(jconn) {

  var connect = {
    query       : query,
    update      : update,
    beginTran   : jconn.beingTran,
    commit      : jconn.commit,
    rollback    : jconn.rollback,
    end         : end,
    isClosed    : isClosed,
  };

  var update_s;


  function isClosed() {
    return jconn.isClosed();
  }

  function query(sql, rcb) {
    rcb( createQuery(sql, jconn) );
  }

  function update(sql, rcb) {
    _update_statement(function(err, stat) {
      if (err) return rcb(err);
      stat.update(sql, rcb);
    });
  }

  function _update_statement(rcb) {
    if (update_s) return rcb(null, update_s);

    jconn.createStatement(function(err, statement) {
      if (err) return rcb(err);
      update_s = statement;
      rcb(null, update_s);
    });
  }

  function end(rcb) {
    update_s = null;
    jconn.close(rcb);
  }

  return connect;
}


function createQuery(sql, jconn) {

  var query = {
    onMeta : onMeta,
    onData : onData,
    onEnd  : onEnd,
    onErr  : onErr,
    pause  : _pause,
    resume : resume,
    end    : end
  };

  // pause 对承载两种数据类型, 当停止时, pause 会保持继续运行的函数
  var pause  = false;
  var stop   = false;
  var nfunc  = function() {/* do nothing. */};
  var events = new EventEmitter();


  function end() {
    stop = true;
  }

  function _pause() {
    if (!pause) {
      pause = true;
    }
  }

  function resume() {
    if (pause) {
      if (typeof pause == 'function') pause();
      pause = null;
    }
  }

  function _doSql() {

    jconn.createStatement(function(err, statement) {
      if (err) return events.emit('error', err);

      events.on('end', function() {
        statement.close(nfunc);
      });

      _exe(statement);
    });


    function _exe(statement) {
      statement.execute(sql, function(err, resultSet) {
        if (err) return events.emit('error', err);

        resultSet.getMeta(function(err, meta) {
          if (err) return events.emit('error', err);

          if (meta) {
            tranType(meta);
            events.emit('meta', meta);
            loopData(resultSet);
          } else {
            resultSet.next(function(err, data) {
              events.emit('row', data);
              events.emit('end');
            });
          }
        });
      });

      function loopData(resultSet) {
        function _loop() {
          if (stop) {
            events.emit('end');
            return;
          }
          else if (pause) {
            pause = function() {
              loopData(resultSet);
            }
            return;
          }

          resultSet.next(function(err, row) {
            if (err) return events.emit('error', err);
            if (row) {
              events.emit('row', row);
              setImmediate(_loop);
            } else {
              events.emit('end');
            }
          });
        }
        _loop();
      }
    }
  }

  // 防止因没有注册监听器而抛出异常
  function _check_event() {
    if (EventEmitter.listenerCount(events, 'meta') < 1) {
      onMeta(function() {
        console.log('db3 query not has `meta` listener, but get metadata.');
      });
    }

    events.on('error', function(err) {
      setImmediate(function() {
        events.emit('end', err);
      });
    });
  }

  function onMeta(_rcb) {
    events.on('meta', _rcb);
  }

  function onData(_rcb) {
    events.on('row', _rcb);
    _check_event();
    // 因为操作都在异步中, 所以立即调用也没有问题
    _doSql();
  }

  function onEnd(_rcb) {
    events.on('end', _rcb);
  }

  function onErr(_rcb) {
    events.on('error', _rcb);
  }

  return query;
}


function tranType(meta) {
  for (var i = 0; i < meta.length; ++i) {
    meta[i].typename = typemapping[ meta[i].type ] || ('UNKNOW:' + meta[i].type);
  }
}
