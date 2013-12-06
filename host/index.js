var argo = require('argo');
var pipeworks = require('pipeworks');
var router = require('argo-url-router');
var BuildContainer = require('./build_container');
var server = require('./config/server');

argo()
  .use(router)
  .post('/builds/{name}', function(handle) {
    handle('request', postBuild);
  })
  .listen(process.env.PORT || 3000);

var postBuild = function(env, next) {
  var container = BuildContainer.create(server);

  var pipeline = pipeworks();

  pipeline.fit(function(context, next) {
    container.create(context.env, function(err, body) {
      if (!body || err) {
        env.response.statusCode = 500;
        return context.next(context.env);
      }

      body = JSON.parse(body.toString());
      context.id = body.Id;

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    container.attach(context.env, context.id, function(err, client) {
      if (err) {
        context.env.response.statusCode = 500;
        return context.next(context.env);
      }

      context.client = client;
      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    container.start(context.env, context.id, function(err) {
      if (err) {
        env.response.statusCode = 500;
        return context.next(context.env);
      }

      context.client.end();

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    container.wait(context.env, context.id, function(err) {
      if (err) {
        console.log(err);
        context.env.response.statusCode = 500;
      }

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    context.next(context.env);
  });

  pipeline.flow({ env: env, next: next });
};
