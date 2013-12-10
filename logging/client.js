//Basic log listener client implementation.
//Will register proper channel with the server, and then sit waiting for log messages on a particular channel from Redis

var util = require('util'),
    Duplex = require('stream').Duplex,
    EventEmitter = require('events').EventEmitter,
    extend = require('extend'),
    WebSocket = require('ws');


util.inherits(LogStream, Duplex);
function LogStream(options,client,channel){
  Duplex.call(this, options);
  this.client = client;
  this.channel = channel;
  this.stopFlag = false;
}

LogStream.prototype._read = function(size){
  this.stopFlag = false;
};

LogStream.prototype._write = function(chunk, encoding, callback){
  var message = null;
  if(Buffer.isBuffer(chunk)){
    message = chunk.toString();
  }else{
    message = chunk;
  }

  this.client.publish(this.channel,message,callback);
};

LogStream.prototype._onData = function(msg){
  if(this.stopFlag)
    return

  if(!this.push(msg.message)){
    this.stopFlag = true;
  }
};


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

LogClient.prototype.stream = function(channel){
  var stream = new LogStream({},this,channel);
  this.listen(channel,stream._onData.bind(stream));
  return stream;
};

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

  this.ws.on('error',function(err){self.emit(err);});

};

LogClient.prototype.listen = function(channel,func){
  this._channelSubscribe(channel);
  this.on(channel,func);
};

LogClient.prototype.publish = function(channel,message,callback) {
  this.ws.send(JSON.stringify({type : 'add',channel : channel,message : message}),callback);
};

LogClient.prototype.close = function(){
  this.ws.close();
};
