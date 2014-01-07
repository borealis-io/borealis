var LogClient = require('../client');

var c = new LogClient();

c.open(function(){

	var i = 0;
	setInterval(function(){
		i++;
		c.publish('app1','log from ws client ' + i);
	},500);
})

