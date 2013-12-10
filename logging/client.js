//Basic log listener client implementation.
//Will register proper channel with the server, and then sit waiting for log messages on a particular channel from Redis

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    extend = require('extend'),
    WebSocket = require('ws');

/*

var WebSocket = require('ws'),
    host = process.env.WEB_SOCKET_HOST || '0.0.0.0',
    port = process.env.WEB_SOCKET_PORT || 3000,
    wsPath = 'ws://'+host+':'+port+'/',
    ws = new WebSocket(wsPath);

ws.on('open', function() {
  var msg = {
  	type : 'subscribe',
  	channel : 'app1'
  };
  ws.send(JSON.stringify(msg));

  setTimeout(function(){
	var msg = {
	  	type : 'add',
	  	channel : 'app1',
	  	message : 'new message from ws'
	  };

  	ws.send(JSON.stringify(msg));
  },5000)

});

ws.on('message', function(data, flags) {
  console.log(data);
});

*/


util.inherits(LogClient, EventEmitter);

function LogClient(opts){
  if(!(this instanceof LogClient))
    return new LogClient(opts);

  this.options = {
    host : '127.0.0.1',
    port : '3000'
  };

  extend(this.options,opts);

  var self = this;

  self.ws = new WebSocket('ws://'+self.options.host+':'+self.options.port+'/');

  self.ws.on('open',function(){
    self.ws.on('message',function(data){
      try{
        var msg = JSON.parse(data);
        console.log(msg);
      }catch(err){
        self.emit('error',err);
      }
    });
  });

  self.ws.on('error',function(err){
    self.emit('error',err);
  });
}

var origOn = LogClient.prototype.on;
LogClient.prototype.on = function(){
  origOn.apply(this,arguments);
};


var c = new LogClient();

c.on('asd',function(){
  console.log(arguments)
});



