var argo = require('argo'),
    resource = require('argo-resource'),
    router = require('argo-url-router'),
    http = require('http'),
    redis = require('redis'),
    uuid = require('node-uuid'),
    ws = require('ws'),
    port = process.env.REDIS_PORT || 6379,
    host = process.env.REDIS_HOST || "127.0.0.1";

var redisClient = new redis.createClient(port, host);

var Logs = function() {
  this.redisClient = redisClient;
};

Logs.prototype.init = function(config) {
  config
    .path('/logs')
    .consumes('application/json')
    .get('/{channel}', this.list)
    .post('/{channel}', this.add)
    .del('/{channel}', this.removeChannel);
};

Logs.prototype.list = function(env, next) {
  var channel = env.route.params.channel;
  this.redisClient.lrange("chan:"+channel, 0, -1, function(error, response) {
    if(error) {
      env.response.statusCode = 500;
      env.response.body = { "error":error };
    } else {
      env.response.statusCode = 200;
      env.response.body = JSON.stringify(response); 
    }
    next(env);
  });
};

Logs.prototype.add = function(env, next) {
  var channel = env.route.params.channel;
  var self = this;
  env.request.getBody(function(err, buf) {
    if(err) {
      env.response.statusCode = 500;
      env.response.body = {"error":err};
    } else {
      var channelKey = "chan:"+channel;
      var body = JSON.parse(buf.toString());
      self.redisClient.lpush(channelKey, body.message, function(error, response) {
        if(error) {
          env.response.statusCode = 500;
          env.response.body = {"error":error};
          return next(env);
        } else {
          wsClients.publish(channel,body.message);
          env.response.statusCode = 204;
          return next(env);
        }
      });
    }
  });
};

Logs.prototype.removeChannel = function(env, next) {
  var channel = env.route.params.channel;
  this.redisClient.del("chan:"+channel, function(error, response) {
    if(err) {
      env.response.statusCode = 500;
      env.response.body = { "error": error };
      return next(env);
    } else {
      env.response.statusCode = 204;
      return next(env);
    }
  });
};

var app = argo()
              .use(router)
              .use(resource(Logs))
              .build();

var server = http.createServer(app.run).listen(process.env.PORT || 3000);


var WsSocketMessages = {
  SUBCRIBE : 'subscribe',
  UNSUBSCRIBE : 'unsubscribe',
  ADD : 'add',
  EVENT : 'event'
};

//Websocket logging implementation below.
var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({server: server}),
    wsClients = new ClientMappings();

function ClientMappings(){
  if(!(this instanceof ClientMappings))
    return new ClientMappings();

  this.mappings = {};
}

ClientMappings.prototype.publish = function(channel,msg,ws) {
  if(this.mappings[channel] === undefined)
    return;

  var msgObject = {
    type : WsSocketMessages.EVENT,
    channel : channel,
    message : msg
  };

  if(ws === undefined){
    for(var cId in this.mappings[channel]){
      try{
        this.mappings[channel][cId].send(JSON.stringify(msgObject));
      }catch(err){
        console.error(err)
      }
    }
  }else{
    if(this.mappings[channel] && this.mappings[channel][ws._clientId]){
      this.mappings[channel][ws._clientId].send(JSON.stringify(msgObject));
    }
  }
};

ClientMappings.prototype.subscribe = function(ws,channel) {

  if(this.mappings[channel] === undefined){
    this.mappings[channel] = {};
  }

  this.mappings[channel][ws._clientId] = ws;
};

ClientMappings.prototype.unsubscribe = function(ws,channel){
  // if channel is undefined remove ws from all attached channels.
  if(channel === undefined){
    for(var ch in this.mappings){
      delete this.mappings[ch][ws._clientId];
    }
  }else{
    if(this.mappings[channel] === undefined)
      return;

    delete this.mappings[channel][ws._clientId];
  }
};

//Connection event.    
wss.on('connection', function(ws) {
  ws._clientId = uuid.v1();

  ws.on('message', function(message) {
    var messageObject = JSON.parse(message);

    if(messageObject.type === WsSocketMessages.SUBCRIBE){
      
      wsClients.subscribe(ws,messageObject.channel);
      ws.send(JSON.stringify({subscription : messageObject.channel}));
      redisClient.lrange("chan:"+messageObject.channel, 0, 19, function(error, response) {
        if(!error) {
          for(var i=response.length;i>=0;--i){
            wsClients.publish(messageObject.channel,response[i],ws);
          }
        }
      });

    }else if(messageObject.type === WsSocketMessages.UNSUBSCRIBE){
      
      wsClients.unsubscribe(ws,messageObject.channel);

    }else if(messageObject.type === WsSocketMessages.ADD){
      
      var channelKey = "chan:"+messageObject.channel;

      redisClient.lpush(channelKey,messageObject.message, function(error, response) {
        if(error) {
          ws.send(JSON.stringify({subscription : messageObject.channel,status : 500}));
        } else {
          wsClients.publish(messageObject.channel,messageObject.message);
          ws.send(JSON.stringify({subscription : messageObject.channel,status : 204}));
        }
      });

    }else{
      // type does not exist
      ws.send(JSON.stringify({subscription : messageObject.channel,status : 404,message : 'message type not valid'}));
    }
  });

  ws.on('close',function(){
    wsClients.unsubscribe(ws);
  });

});
