
var a = Date.now();
var arr = [];

for (var i=0; i<10000000; ++i) {
	arr.push(i);
}

console.log('create use', Date.now() - a, 'ms ================================');
a = Date.now();

for (var i=0; i<arr.length; ++i) {
	nulfun();
}

console.log('for use', Date.now() - a, 'ms ================================');
a = Date.now();

var len = arr.length;
for (var i=0; i<len; ++i) {
	nulfun();
}

console.log('for len use', Date.now() - a, 'ms ================================');
a = Date.now();

arr.forEach(function() {
	nulfun();
});

console.log('forEach use', Date.now() - a, 'ms ================================');
a = Date.now();

function nulfun() {
	process.uptime();
}