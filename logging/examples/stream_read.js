var fs = require('fs'),
    LogClient = require('../client');

var c = new LogClient();
c.open(function(){
	var w = fs.createWriteStream('file.txt');
	var r = c.stream('app1');
	r.pipe(w);
});
