var java = require('java-factory-lib').getJavaInstance();


// 如果数据量很大, 每次缓存的数据行
var FetchSize = 3000;
// 从 JAVA 中读取行, 进行缓存, 最佳实践
var ROW_CACHE_SIZE = 1000;


module.exports.createDriver = createDriver;


//
// 创建到数据库的连接, 数据库的 jar 包要配置好
// (driverName, RCB)
// RCB: function(err, driver);
// properties: java 扩展属性设置
// driverName: 数据库驱动的名称
//
function createDriver(driverName, properties, RCB) {

  java.newInstance(driverName, function(err, driver) {
    if (err) return RCB(err);
    RCB(null, wrapDriver(driver));
  });


  //
  // 包装了 java.sql.Driver 对象
  //
  function wrapDriver(_java_driver) {
    //
    // 导出的方法
    //
    var _drv = {
      // (url, user, pass, RCB)
      // RCB: Function(err, connection)
      connect: connect
    };

    function connect(url, user, pass, RCB) {
      java.newInstance('java.util.Properties', function(err, prop) {
        if (err) return RCB(err);

        java.callMethodSync(prop, 'setProperty', 'user', user);
        java.callMethodSync(prop, 'setProperty', 'password', pass);

        if (properties) {
          for (var pname in properties) {
            java.callMethodSync(prop,
                'setProperty', pname, properties[pname]+'');
          }
        }

        java.callMethod(_java_driver, 'connect', url, prop, function(err, connection) {
          if (err) return RCB(err);
          RCB(null, warpConnection(connection));
        });
      });
    };

    return _drv;
  }

  //
  // 包装了 java.sql.Connection 对象
  //
  function warpConnection(_java_connection) {
    //
    // 导出的方法
    //
    var _conn = {
      // (RCB)
      // RCB: Function(err, statement)
      createStatement : createStatement,
      // 都是: function(RCB), RCB: Function(err)
      close           : close,
      beingTran       : beingTran,
      commit          : commit,
      rollback        : rollback,
      isClosed        : isClosed,
    };

    function createStatement(RCB) {
      java.callMethod(_java_connection, 'createStatement', function(err, statement) {
        if (err) return RCB(err);

        java.callMethod(statement, 'setFetchSize', FetchSize, function(err) {
          if (err) return RCB(err);
          RCB(null, warpStatement(statement));
        });
      });
    }

    function close(RCB) {
      java.callMethod(_java_connection, 'close', RCB || def_rcb);
    }

    function isClosed() {
      return java.callMethodSync(_java_connection, 'isClosed');
    }

    function beingTran(RCB) {
      _auto_commit(false, RCB);
    }

    function commit(RCB) {
      java.callMethod(_java_connection, 'commit', function(err) {
        if (err) return RCB(err);
        _auto_commit(true, RCB);
      });
    }

    function rollback(RCB) {
      java.callMethod(_java_connection, 'rollback', function(err) {
        if (err) return RCB(err);
        _auto_commit(true, RCB);
      });
    }

    function _auto_commit(autoCommit, RCB) {
      java.callMethod(_java_connection, 'setAutoCommit', autoCommit, RCB);
    }

    return _conn;
  }

  //
  // 包装了 java.sql.Statement 对象
  //
  function warpStatement(_java_statement) {
    //
    // 导出的方法
    //
    var _stm = {
      // 如果在一个 Statement 上运行过查询, 再次调用会关闭上一次查询
      // (sql, RCB)
      // RCB: (err, ResultSet)
      execute: execute,

      // 快速执行一个更新查询
      update : update,

      // ()
      // RCB: (err)
      close  : close,
    };

    function update(sql, RCB) {
      java.callMethod(_java_statement, 'executeUpdate', sql, function(err, count) {
        if (err) return RCB(err);
        RCB(null, count);
      });
    }

    function close(RCB) {
      java.callMethod(_java_statement, 'close', RCB || def_rcb);
      // java.callStaticMethod('java.lang.System', 'gc');
    }

    function execute(sql, RCB) {
      java.callMethod(_java_statement, 'execute', sql, function(err, isResultSet) {
        if (err) return RCB(err);

        if (isResultSet) {
          java.callMethod(_java_statement, 'getResultSet', function(err, resultSet) {
            if (err) return RCB(err);
            RCB(null, warpResultSet(resultSet));
          });
        } else {
          RCB(null, nullResultSet(_java_statement))
        }
      });
    }

    return _stm;
  }

  //
  // 更新的方法不会生成 java.sql.ResultSet
  // 这里虚拟一个 ResultSet 的接口
  //
  function nullResultSet(_java_statement) {
    //
    // 导出的方法
    //
    var rs = {
      // (RCB)
      // RCB: Function(err, meta)
      // meta: 总是返回 null
      getMeta         : getMeta,
      // (RCB)
      // RCB: Function(err, count)
      // 总是返回 null
      getColumnCount  : getColumnCount,
      // 总是返回一个结构, 说明影响的行数
      // (RCB)
      // RCB: Function(err, row)
      next            : next
    };

    var _data = null;

    function getMeta(RCB) {
      RCB();
    }

    function getColumnCount(RCB) {
      RCB();
    }

    function next(RCB) {
      if (_data)
        return RCB(null, _data);

      java.callMethod(_java_statement, 'getUpdateCount', function(err, affectedRows) {
        _data = {
          affectedRows: affectedRows
        };

        RCB(null, _data);
      });
    }

    return rs;
  }

  //
  // 包装了 java.sql.ResultSet 对象
  //
  function warpResultSet(_java_result_set) {
    //
    // 导出的方法
    //
    var rs = {
      // (RCB)
      // RCB: Function(err, meta)
      // meta: [{ 见说明文档 }]
      getMeta         : getMeta,
      // (RCB)
      // RCB: Function(err, count)
      getColumnCount  : getColumnCount,
      // 如果没有更多数据, 则 row 为空
      // (RCB)
      // RCB: Function(err, row)
      next            : next
    };

    var _count = -1;
    var _meta  = null;
    var SelectTool = java.import('zr.node.db.SelectTool');


    function getMeta(RCB) {
      if (_meta)
        return RCB(null, _meta);

      java.callMethod(_java_result_set, 'getMetaData', function(err, resultSetMetaData) {
        if (err) return RCB(err);

        java.callMethod(resultSetMetaData, 'getColumnCount', function(err, _col) {
          if (err) return RCB(err);

          _count = _col;
          var meta = [];
          var r = 0;

          try {
            var nullable_val = java.getStaticFieldValue(
                'java.sql.ResultSetMetaData', 'columnNullable');

            for (var i=1; i<=_col; ++i) {
              meta[i-1] = {
                field     : java.callMethodSync(resultSetMetaData,
                                                'getColumnName', i),
                type      : java.callMethodSync(resultSetMetaData,
                                                'getColumnType', i),
                size      : java.callMethodSync(resultSetMetaData,
                                                'getColumnDisplaySize', i),
                nullable  : java.callMethodSync(resultSetMetaData,
                                                'isNullable', i) == nullable_val
              };
            }

            _meta = meta;
            RCB(null, _meta);
          } catch(errr) {
            RCB(errr);
          }
        });
      });
    }

    function getColumnCount(RCB) {
      if (_count >= 0)
        return RCB(null, _count);

      getMeta(function(err) {
        RCB(err, _count);
      });
    }

    function next(RCB) {
      getMeta(function(err, meta) {
        if (err) return RCB(err);
        _t_next(RCB);
        rs.next = _t_next;
      });
    }

    var _cache_arr = null;
    var _cache_pos = 0;
    var _cache_len = -1;

    function _t_next(RCB) {
      if (_cache_pos >= _cache_len) {
        SelectTool.select(_java_result_set, ROW_CACHE_SIZE, function(err, arr) {
          if (err)  return _not_data(err);
          if (!arr) return _not_data();

          _cache_arr = arr;
          _cache_pos = 0;
          _cache_len = arr.length;
          _next_row();
        });
      } else {
        _next_row();
      }

      function _not_data(err) {
        _java_result_set.close();
        _cache_arr = null;
        RCB(err);
      }

      function _next_row() {
        var c_arr = _cache_arr[_cache_pos];
        if (!c_arr) {
          _not_data();
          return;
        }

        var row = {}, v, i=0;
        for (var i = 0; i < _count; ++i) {
          row[ _meta[i].field ] = c_arr[i];
        }

        ++_cache_pos;
        RCB(null, row);
      }
    }

    return rs;
  }
}


function def_rcb(err) {
  if (err) {
    console.debug(err);
  }
}
