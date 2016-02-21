var java = require("java");
var path = require('path');

/* sql server:
String driverName = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
String url = "jdbc:sqlserver://localhost:1433; DatabaseName=test";
*/

/* Oracle:
String driverName = "oracle.jdbc.OracleDriver";
String url = "jdbc:oracle:thin:[user/password]@[host][:port]:SID";
*/

/* create driver:
Class.forName(driverName);
dbConn = DriverManager.getConnection(dbURL, userName, userPwd);
*/

 
var url = 'jdbc:oracle:thin:sys as sysdba/zhirong@//192.168.7.22:1521/XE';
var driverName = "oracle.jdbc.OracleDriver";
var sql = "select * from test";

function _insert() {
	var _name = [];
	for (var i=0; i<100; ++i) {
		_name.push('.');
	}

	var sql = "insert into test (ID, NAME) values ('1000000090', '" + _name.join('') + "')";
}


java.classpath.push( path.normalize(__dirname + "/../jar/ojdbc7.jar") );


// driver = new oracle.jdbc.OracleDriver
java.newInstance(driverName, function(err, driver) {
	if (err) return console.log('create driver err:', err);

	// connection = driver.connect(url, null)
	java.callMethod(driver, 'connect', url, null, function(err, connection) {
		if (err) return console.log('create connect err:', err);

		// Statement connection.createStatement()
		java.callMethod(connection, 'createStatement', function(err, statement) {
			if (err) return console.log("create statementement err:", err);

			java.callMethodSync(statement, 'setFetchSize', 1000);

			// statement.execute('SQL');
			java.callMethod(statement, 'execute', sql, function(err, retResult) {
				if (err) return console.log("execute err:", err);

				if (retResult) {
					// ResultSet statement.getResultSet()
					java.callMethod(statement, 'getResultSet', function(err, resultSet) {
						if (err) return console.log("getResultSet err:", err);

						// ResultSetMetaData getMetaData()
						java.callMethod(resultSet, 'getMetaData', function(err, resultSetMetaData) {
							if (err) return console.log("getMetaData err:", err);
							var col = 0;

							java.callMethod(resultSetMetaData, 'getColumnCount', function(err, _col) {
								if (err) return console.log("getColumnCount err:", err);
								var meta = [];
								var r = 0;

								try {
									for (var i=1; i<=_col; ++i) {
										meta[i] = {
											field 		: java.callMethodSync(resultSetMetaData, 'getColumnName', i),
											type  		: java.callMethodSync(resultSetMetaData, 'getColumnType', i),
											size  		: java.callMethodSync(resultSetMetaData, 'getColumnDisplaySize', i),
											nullable 	: java.callMethodSync(resultSetMetaData, 'isNullable', i) 
															 == java.getStaticFieldValue('java.sql.ResultSetMetaData', 'columnNullable')
										};
									}
									console.log(resultSetMetaData);
								} catch(errr) {
									console.log('resultSetMetaData', errr);
								}

								console.log('meta', meta)
								next();
								
								function next() {
									java.callMethod(resultSet, 'next', function(err, has) {
										if (err) return console.log("next err:", err);
										if (!has) return;
										var row = [];

										try {
											for (var i=1; i<=_col; ++i) {
												row[i] = java.callMethodSync(resultSet, 'getNString', i);
											}
											console.log('row', ++r, row);
											if (r < 10) next();
										} catch(errr) {
											console.log('resultSet', errr);
										}
									});
								}
							});
						});
					});

				} else {
					java.callMethod(statement, 'getUpdateCount', function(err, count) {
						if (err) return console.log("getUpdateCount err:", err);

						console.log('影响了', count, '行数据');
					});
				}
			})
		})
	});
});


console.log("------------ java success", java.classpath);