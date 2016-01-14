//node modules and global configs
var express = require('express'),
  app = express();



app.get('*', function(req, res) {

	console.log('ddd');

});

app.listen(3000, function() {

    console.log('Running on port', 3000);

});