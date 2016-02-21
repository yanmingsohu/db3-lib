
var driver_list = {
	mysql 		: './driver/mysql.js',
	sqlserver : './driver/sqlserver.js',
	h2local 	: './driver/h2local.js',
	oracle 		: './driver/oracle.js'
};


module.exports = {
	createDriver : createDriver,
	driverList   : driverList
};


function driverList() {
	var list = [];
	for (var n in driver_list) {
		list.push[n];
	}
	return list;
}


function createDriver(config) {
	
	if ( (!config) || (!config.driver) ) {
		throw new Error("invalid config, must have `driver` attribute");
	}
	
	var dblib = driver_list[ config.driver ];

	if (!dblib) {
		throw new Error("unsupport driver `" + config.driver + '`');
	}

	dblib = require(dblib);

	var driver = dblib.createDriver(config);
	return driver;
}