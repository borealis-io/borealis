var fs = require('fs'),
    LogClient = require('../client');

var c = new LogClient();
c.open(function(){
	process.stdin.pipe(c.stream('app1'));
});
