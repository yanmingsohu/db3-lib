var mysql = require('mysql');


module.exports.createDriver = createDriver;


var typemapping = {
  0x00: 'DECIMAL',
  0x01: 'TINY',
  0x02: 'SHORT',
  0x03: 'LONG',
  0x04: 'FLOAT',
  0x05: 'DOUBLE',
  0x06: 'NULL',
  0x07: 'TIMESTAMP',
  0x08: 'LONGLONG',
  0x09: 'INT24',
  0x0a: 'DATE',
  0x0b: 'TIME',
  0x0c: 'DATETIME',
  0x0d: 'YEAR',
  0x0e: 'NEWDATE',
  0x0f: 'VARCHAR',
  0x10: 'BIT',
  0xf6: 'NEWDECIMAL',
  0xf7: 'ENUM',
  0xf8: 'SET',
  0xf9: 'TINY_BLOB',
  0xfa: 'MEDIUM_BLOB',
  0xfb: 'LONG_BLOB',
  0xfc: 'BLOB',
  0xfd: 'VAR_STRING',
  0xfe: 'STRING',
  0xff: 'GEOMETRY'
};


function createDriver(conf) {
  var driver = {
    connect: connect
  };

  function connect(rcb) {
    var connection = mysql.createConnection(conf);
    connection.connect(function(err) {
      if (err) {
        rcb(err);
      } else {
        rcb(null, createConnect(connection));
      }
    });
  }

  return driver;
}


function createConnect(nv_connection) {

  var connect = {
    query       : query,
    update      : update,
    beginTran   : beginTran,
    commit      : commit,
    rollback    : rollback,
    end         : end,
    isClosed    : isClosed,
  };

  var closed = false;
  var lasterror;


  nv_connection.on('error', function(err) {
    lasterror = err;
    closed = true;
    nv_connection.destroy();
  });


  function isClosed() {
    return closed;
  }

  function query(sql, rcb) {
    if (closed) {
      if (lasterror) throw lasterror;
      else throw new Error('connect is closed');
    }
    var nv_query = nv_connection.query(sql);
    rcb( createQuery(nv_query, nv_connection) );
  }

  function update(sql, rcb) {
    nv_connection.query(sql, function(err, result) {
      if (err) return rcb(err);
      rcb(null, result.affectedRows);
    });
  }

  function beginTran(rcb) {
    nv_connection.beginTransaction(rcb);
  }

  function commit(rcb) {
    nv_connection.commit(rcb);
  }

  function rollback(rcb) {
    nv_connection.rollback(rcb);
  }

  function end(rcb) {
    if (closed) {
      rcb();
    } else {
      nv_connection.end(rcb);
      closed = true;
    }
  }

  return connect;
}


function createQuery(_nv_query, _nv_connect) {

  var query = {
    onMeta : onMeta,
    onData : onData,
    onEnd  : onEnd,
    onErr  : onErr,
    pause  : pause,
    resume : resume,
    end    : end
  };

  function pause() {
    _nv_connect.pause();
  }

  function resume() {
    _nv_connect.resume();
  }

  function end() {
    pause();
    // 关闭后, 全局会抛异常
    _nv_query.end();
  }

  function onMeta(_rcb) {
    _nv_query.on('fields', function(fd) {
      var meta = [];

      fd.forEach(function(attr) {
        meta.push({
          'field'   : attr.name,
          'type'    : attr.type,
          'typename': typemapping[ attr.type ],
          'size'    : attr.length,
          'nullable': (attr.flags & 4097) == 0
        });
      });

      _rcb(meta);
    });
  }

  function onData(_rcb) {
    _nv_query.on('result', function(row) {
      _rcb(row);
    });
  }

  function onEnd(_rcb) {
    _nv_query.on('end', _rcb);
  }

  function onErr(_rcb) {
    _nv_query.on('error', _rcb);
  }

  return query;
}
