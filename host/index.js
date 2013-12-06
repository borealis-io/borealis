var argo = require('argo');
var router = require('argo-url-router');
var BuildContainer = require('./build_container');
var server = require('./config/server');

argo()
  .use(router)
  .post('/builds/{name}', function(handle) {
    handle('request', function(env, next) {
      var container = BuildContainer.create(server);

      container.create(env, function(err, body) {
        if (!body || err) {
          env.response.statusCode = 500;
          return next(env);
        }

        body = JSON.parse(body.toString());
        var id = body.Id;

        container.attach(env, id, function(err, client) {
          if (err) {
            env.response.statusCode = 500;
            return next(env);
          }

          container.start(env, id, function(err) {
            if (err) {
              env.response.statusCode = 500;
            }

            client.end();

            container.wait(env, id, function(err) {
              if (err) {
                console.log(err);
                env.response.statusCode = 500;
              }

              next(env);
            });
          });
        });
      });
    });
  })
  .listen(process.env.PORT || 3000);
