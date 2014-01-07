var LogClient = require('../client');

// Open websocket to defualt host and port
var c = new LogClient();

// connect
c.open(function(){

	// once connected subscibe to channel app1
	c.listen('app1',function(msg){
		console.log(msg.message);
	});
});