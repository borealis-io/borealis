var argo = require('argo'),
    resource = require('argo-resource'),
    router = require('argo-url-router'),
    redis = require('redis'),
    ws = require('ws'),
    port = process.env.REDIS_PORT || 6379,
    host = process.env.REDIS_HOST || "127.0.0.1";

var Logs = function() {
  this.redisClient = new redis.createClient(port, host);
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
          if(channelKey in clientMapping) {
            clientMapping[channelKey].send(body.message);
          }
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

argo()
  .use(router)
  .use(resource(Logs))
  .listen(process.env.PORT || 3000);

//Websocket logging implementation below.
var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: process.env.WEB_SOCKET_PORT || 3001}),
    clientMapping = {};

//Connection event.    
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    var messageObject = JSON.parse(message);
    var channel = "chan:"+messageObject.channel;
    ws.send("{'subscription':'"+channel+"'}");
    clientMapping[channel] = ws;
    console.log("WS PACKET:"+message);
  });
});
