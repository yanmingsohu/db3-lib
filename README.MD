# 多种数据库引擎

## install

```bash
npm install java
npm install db3-lib --save
```


## DB Support name list

* `mysql`         -- 使用 node 原生代码
* `sqlserver`     -- 微软数据库
* `oracle`        -- 很麻烦的数据库
* `h2local`       -- H2 本地数据库, 配置中的 host 指定了数据库, 存放数据的本地目录
* `h3cmpp`        -- H3C 数据库集群


> 数据库名称必须完全匹配, 配置中的 driver 字段


## Usage

```js
// 引入库
var db3 = require("db3-lib");

// 设置一个全局唯一的 java 库实例
db3.initJava(require('java'));

// 创建一个到数据库的驱动
var driver = db3.createDriver(config);

// 使用驱动创建连接
driver.connect(Function(err, connect));

// 使用连接创建查询
connect.query(SQL, Function(query));

// 用于运行更新查询的语句, 比 query 速度快
connect.update('insert/update', function(err, affectedRows) { });

// 关闭连接, 多次调用也不会出错
connect.end();

// 测试连接状态
connect.isClosed();

// 执行一批 DDL 语句, 通常用于程序的初始化, 所有日志输出到 console
// cb - Function(err, next, sql); 当程序出错会设置 err,
//      如果还有语句未执行则设置 next, 调用 next 执行;
db3.install(connect, ddl_arr, cb);

// 全自动安装, 这将创建一个驱动并执行
// conf - 数据库连接配置
// allow_sql_fail - true 为允许 sql 语句报错并继续执行
// allow_alert_fail - true 为允许 alert 语句产生警告
db3.installAll(conf, ddl_arr, allow_alert_fail, allow_sql_fail);

// 创建连接池, api 与 driver 相同
var pool = db3.create_conn_pool(config, 1, 3, 2000);
var conn = pool.connect(...);
// 释放连接, 回到池中
conn.end();
```


### 对查询进行操作

```js
// 得到表结构, 如果查询是一个 *更新操作*, 这个方法不会被调用
query.onMeta(function(meta) {});

// 取得**一行**数据, 如果是查询, 这个方法会被轮询直到没有更多数据或者中止
// 如果查询是一个 *更新操作*, row 会有一个 affectedRows 的属性指明修改了多少行
query.onData(function(row) {});

// 注册完成通知, 这个方法被调用, 则查询完成
// 如果发生错误这个方法也会被调用
query.onEnd(function() {})

// 注册错误回调, connect.query 如果发生错误也使用这个方法接受
query.onErr(function(err) {});

// 暂停/继续/终止 一个查询的方法, 都是同步的
query.pause();
query.resume();
query.end();
```

> 注意  mysql 在调用 query.end() 之后如何还有没处理的数据会抛出异常
> 此时需要用 `process.on('uncaughtException',...` 抓住异常, 否则进程会退出


### 对事务的便捷操作

```js
connect.beginTran(function(err) {})
connect.commit(function(err) {})
connect.rollback(function() {})
```


## Data structure

### 1. meta

```js
[
    {   /* column 1 */
        'field'     :'fName',     // 列名
        'typename'  :'fType',     // 列类型的字符串表示
        'type'      :number       // 列类型的数据库编码
        'size'      :'fSize',     // 长度
        'nullable'  :"bool"       // 允许空
    },
    {...}, ...
]
```
> type 属性基于不同的数据库都会有不同的值
> typename 时转义之后的值, 可以通过引入 lib/types.js 反转为唯一数值

### 2. row

```js
{ fieldName:fieldData, ... }
```

### 3. config

```js
{
  driver   : 'mysql',           // 驱动名称
  host     : 'localhost',       // 主机 / 本地路径(h2local)
  user     : 'root',            // 用户名
  password : '',                // 密码
  port     : '3306',            // 端口
  database : 'log_for_node',    // 数据库名 / 实例名(oracle)
  properties : {},              // 数据库连接扩展属性设置, 可以为空
}
```


## offline 特性

> 允许大量执行更新/插入操作, 这些数据的写入是延迟的,
> 当数据数量/延迟时间达到一个阀值, 会启动一个独立的线程进行写入.
> 如果创建到数据库的连接失败, 会等待一个周期后重试, 数据会被保留,
> 其他的错误/异常/程序崩溃, 会导致数据丢失.


```js
config[driver, host, ....]
config.tmpdir = '保存临时文件';

//
// 设置全局离线工作线程数量
//
db3.set_work_thread(1000)

//
// 创建一个离线数据缓冲
//
var off = db3.offine(config);

//
// 执行一个sql
//
off.update(sql);

//
// 抓取异常
//
off.on('error', function(err) {
  console.log('Has err', err);
});

//
// 写出完成事件
//
off.on('wover', function(inf) {
  console.log('进程:', inf.pid, ', 数据行:', inf.count);
});

//
// 写出开始事件
//
off.on('wbegin', function(inf) {
  console.log('进程:', inf.pid, ', 数据行:', inf.count);
});

//
// 当连接失败, 发出重试消息
//
off.on('retry', function(inf) {
  console.log('进程:', inf.pid,
              '重试次数:', inf.recont, '出错原因:', inf.err,
              'DB配置:', inf.dbconfig);
});
```
