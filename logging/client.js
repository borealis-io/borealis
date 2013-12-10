//Basic log listener client implementation.
//Will register proper channel with the server, and then sit waiting for log messages on a particular channel from Redis

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    extend = require('extend'),
    WebSocket = require('ws');


module.exports = LogClient;

util.inherits(LogClient, EventEmitter);

function LogClient(opts){
  if(!(this instanceof LogClient))
    return new LogClient(opts);

  this.options = {
    host : '127.0.0.1',
    port : '3000'
  };

  extend(this.options,opts);

  this.ws = {};

}

LogClient.prototype._channelSubscribe = function(channel,cb){
  this.ws.send(JSON.stringify({type : 'subscribe',channel : channel}),cb);
};

LogClient.prototype._channelUnsubscribe = function(channel,cb){
  this.ws.send(JSON.stringify({type : 'unsubscribe',channel : channel}),cb);
};

LogClient.prototype._onData = function(data){
  var self = this;

  try{
    var msg = JSON.parse(data);

    if(msg.type === 'event' && msg.channel && msg.message){
      self.emit(msg.channel,msg);
    } 

    //console.log(msg);
  }catch(err){
    console.log(err)
    self.emit('error',err);
  }
};

LogClient.prototype.open = function(cb){
  var self = this;
  this.ws = new WebSocket('ws://'+self.options.host+':'+self.options.port+'/');

  self.ws.on('open',function(){
    self.ws.on('message',self._onData.bind(self));
    cb();
  });

  this.ws.on('error',self.emit);
};

LogClient.prototype.listen = function(channel,func){
  this._channelSubscribe(channel);
  this.on(channel,func);
};

LogClient.prototype.publish = function(channel,message) {
  this.ws.send(JSON.stringify({type : 'add',channel : channel,message : message}))
};

LogClient.prototype.close = function(){
  this.ws.close();
};
