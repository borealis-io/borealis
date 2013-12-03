var argo = require('argo');
var logger = require('argo-clf');

var id = process.env.SERVER_ID || 'Earth';

argo()
  .use(logger)
  .get('/', function(handle) {
    handle('request', function(env, next) {
      var hostHeader = env.request.headers['x-forwarded-host'] || env.request.headers['host'];
      var host = hostHeader || 'friend!';
      env.response.body = 'Hello from ' + id + ', ' + host + '!';
      next(env);
    });
  })
  .listen(process.env.PORT || 3000);
