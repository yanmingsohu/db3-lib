var factory = require('./factory.js');


module.exports = {
  create_conn_pool : create_conn_pool
};


//
// 使用配置创建数据库连接池
// 只保存最多 max 个连接, 超过 time 时间则释放连接
// 直到数量 min 则停止释放
//
function create_conn_pool(_dbconf, min, max, time) {
  var driver = factory.createDriver(_dbconf);
  var pool = [];
  var use = 0;

  if (!min)  min  = 1;
  if (!max)  max  = 3;
  if (!time) time = 15 * 1000;


  var tid = setInterval(function() {
    if (pool.length > min) {
      var c = pool.pop();
      c.end.apply(c.conn);
    }
  }, Math.max(time, 1000));


  function recover(conn, _end) {
    if (pool.length < max) {
      pool.push({ conn: conn, end: _end });
    } else {
      _end.apply(conn);
    }
    --use;
  }


  function new_conn(rcb) {
    driver.connect(function(err, connect) {
      if (err) return rcb(err);

      var _end = connect.end;

      connect.end = function(_rcb) {
        recover(connect, _end);
        _rcb && _rcb();
      };

      ++use;
      rcb(null, connect);
    });
  }


  function get(rcb) {
    var c = pool.pop();
    if (c && (!c.conn.isClosed()) ) {
      ++use;
      rcb(null, c.conn);
    } else {
      new_conn(rcb);
    }
  }


  function state() {
    return {
      sleep : pool && pool.length,
      use   : use,
      min   : min,
      max   : max, 
      time  : time,
      isend : pool == undefined
    };
  }


  function free(rcb) {
    if (!driver) return rcb(new Error('is end.'));
    driver = undefined;

    var fid = setInterval(function() {
      if (use <= 0) {
        clearInterval(fid);
        clearInterval(tid);
        pool.forEach(function(c) {
          c.end.apply(c.conn);
        });
        pool = undefined;
        rcb();
      }
    }, 1000);
  }


  return {
    //
    // 获取连接池 
    //
    get : get,
    //
    // 获取状态
    //
    state : state,
    //
    // 等到所有连接都回收之后
    // 释放连接池, 释放之后这个对象不能继续使用
    //
    end : free
  }
}