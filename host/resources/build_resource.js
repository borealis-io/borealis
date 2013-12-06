var pipeworks = require('pipeworks');
var Container = require('../container');
var config = require('../config/build_container');
var server = require('../config/server');

var BuildResource = module.exports = function() {
};

BuildResource.prototype.init = function(config) {
  config
    .path('/builds')
    .post('/{name}', this.create, { consumes: ['application/x-tar'] });
};

BuildResource.prototype.create = function(env, next) {
  var container = Container.create(server);

  var pipeline = pipeworks();

  pipeline.fit(function(context, next) {
    container.create(config, function(err, body) {
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
    container.attach(context.id, context.env.request, function(err, client) {
      if (err) {
        context.env.response.statusCode = 500;
        return context.next(context.env);
      }

      context.client = client;
      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    container.start(context.id, function(err) {
      if (err) {
        env.response.statusCode = 500;
        return context.next(context.env);
      }

      context.client.end();

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    container.wait(context.id, function(err) {
      if (err) {
        context.env.response.statusCode = 500;
        return context.next(context.env);
      }

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    console.log(context.id);
    container.commit(context.id, context.env.route.params.name, function(err, id) {
      if (err) {
        console.log(err);
        context.env.response.statusCode = 500;
        return context.next(context.env);
      }

      context.image = id;
      console.log(id);
      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    context.next(context.env);
  });

  pipeline.flow({ env: env, next: next });
};
