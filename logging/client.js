//Basic log listener client implementation.
//Will register proper channel with the server, and then sit waiting for log messages on a particular channel from Redis

var WebSocket = require('ws'),
    host = process.env.WEB_SOCKET_HOST || '0.0.0.0',
    port = process.env.WEB_SOCKET_PORT || 3001,
    wsPath = 'ws://'+host+':'+port+'/',
    ws = new WebSocket(wsPath);

ws.on('open', function() {
  ws.send('{"channel":"app1"}');
});

ws.on('message', function(data, flags) {
  console.log(data);
});
