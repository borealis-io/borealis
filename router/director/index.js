var querystring = require('querystring');
var argo = require('argo');
var gzip = require('argo-gzip');
var urlRouter = require('argo-url-router');
var logger = require('argo-clf');

var router = {};

argo()
  .use(urlRouter)
  .use(logger)
  .use(gzip)
  .use(function(handle) {
    handle('request', function(env, next) {
      var host = env.request.headers['host'];

      if (host && router.hasOwnProperty(host)) {
        env.request.headers['X-Forwarded-Host'] = host;
        env.request.headers['X-Forwarded-Proto'] = env.request.connection.encrypted ? 'https' : 'http';

        if (forwardedFor) {
          var forwardedFor = env.request.headers['X-Forwarded-For'];
          env.request.headers['X-Forwarded-For'] = forwardedFor + ', ' + env.request.connection.remoteAddress;
        } else {
          env.request.headers['X-Forwarded-For'] = env.request.connection.remoteAddress;
        }

        env.target.url = router[host] + env.request.url;
      } else {
        env.response.statusCode = 404;
      }

      next(env);
    });
  })
  .listen(process.env.PORT || 3000);

argo()
  .use(urlRouter)
  .use(logger)
  .post('/apps', function(handle) {
    handle('request', function(env, next) {
      env.request.getBody(function(err, body) {
        if (err || !body) {
          env.response.statusCode = 400;
          return next(env);
        }

        var parsed = querystring.parse(body.toString());

        if (!parsed.host || !parsed.target) {
          env.response.statusCode = 400;
          return next(env);
        }

        router[parsed.host] = parsed.target;
        env.response.statusCode = 201;
        next(env);
      });
    });
  })
  .del('/apps/{app}', function(handle) {
    handle('request', function(env, next) {
      var app = env.route.params.app;

      if (!router.hasOwnProperty(app)) {
        env.response.statusCode = 404;
      } else {
        delete router[app];
        env.response.statusCode = 204;
      }

      next(env);
    });
  })
  .listen(process.env.ADMIN_PORT || 3001);
