
var types = {
	DECIMAL     : 0x00, 
	TINY        : 0x01, 
	SHORT       : 0x02, 
	LONG        : 0x03, 
	FLOAT       : 0x04, 
	DOUBLE      : 0x05, 
	NULL        : 0x06, 
	TIMESTAMP   : 0x07, 
	LONGLONG    : 0x08, 
	INT24       : 0x09, 
	DATE        : 0x0a, 
	TIME        : 0x0b, 
	DATETIME    : 0x0c, 
	YEAR        : 0x0d, 
	NEWDATE     : 0x0e, 
	VARCHAR     : 0x0f, 
	BIT         : 0x10, 
	NEWDECIMAL  : 0x11, 
	ENUM        : 0x12, 
	SET         : 0x13, 
	TINY_BLOB   : 0x14, 
	MEDIUM_BLOB : 0x15, 
	LONG_BLOB   : 0x16, 
	BLOB        : 0x17, 
	VAR_STRING  : 0x18, 
	STRING      : 0x19, 
	GEOMETRY    : 0x1a,
	ARRAY       : 0x30,
	NVARCHAR    : 0x31,
	BINARY      : 0x32,
	BOOLEAN     : 0x33,
	CHAR        : 0x34,
	NCHAR       : 0x35,

	UNSUPPORT   : 0xFE
};

for (var k in types) {
	var v = types[k];
	types[v] = k;
}

module.exports.types = types;