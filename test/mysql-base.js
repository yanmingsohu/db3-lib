var mysql      = require('mysql');

var config = {
  driver   : 'mysql',
  host     : '192.168.7.11',
  port     : '33066',
  user     : 'connuser',
  password : 'dalianzhirong321_A',
  database : ''
};


var connection = mysql.createConnection(config);

connection.connect(function(err, c) {
   console.log('11conn err', err, c);
});

var query = connection.query('select * from a297dfacd7a84eab9656675f61750078.test limit 10');
query
  .on('error', function(err) {
    // Handle error, an 'end' event will be emitted after this as well
    console.log('q err', err);
  })
  .on('fields', function(fields) {
    // the field packets for the rows to follow
    console.log('fields', fields);
  })
  .on('result', function(row) {
    // Pausing the connnection is useful if your processing involves I/O
    connection.pause();

    processRow(row, function() {
      connection.resume();
    });
  })
  .on('end', function(e) {
    // all rows have been received
    console.log('end', e)
  });

function processRow(row) {
  console.log('row', row)
}


// connection.end();