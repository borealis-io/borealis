var pipeworks = require('pipeworks');
var Container = require('../container');
var config = require('../config/build_container');
var server = require('../config/server');
var nextPort = require('../port_finder');

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
    container.commit(context.id, 'build-' + context.env.route.params.name, function(err, id) {
      if (err) {
        context.env.response.statusCode = 500;
        return context.next(context.env);
      }

      context.image = id;
      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    var config = {
      Image: 'build-' + context.env.route.params.name,
      Cmd: ['/build/builder']
    };

    container.create(config, function(err, body) {
      if (!body || err) {
        env.response.statusCode = 500;
        return context.next(context.env);
      }

      body = JSON.parse(body.toString());
      context.appId = body.Id;

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    container.start(context.appId, function(err) {
      if (err) {
        env.response.statusCode = 500;
        return context.next(context.env);
      }

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    container.wait(context.appId, function(err) {
      if (err) {
        context.env.response.statusCode = 500;
        return context.next(context.env);
      }

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    container.commit(context.appId, 'app-' + context.env.route.params.name, function(err, id) {
      if (err) {
        context.env.response.statusCode = 500;
        return context.next(context.env);
      }

      context.appImage = id;
      next(context);
    });
  });

  // release
  pipeline.fit(function(context, next) {
    var config = {
      Image: 'app-' + context.env.route.params.name,
      Cmd: ['/app/bin/node', '/app'],
      Env: ['PORT=5000'],
    };

    container.create(config, function(err, body) {
      if (!body || err) {
        env.response.statusCode = 500;
        return context.next(context.env);
      }

      body = JSON.parse(body.toString());
      context.runId = body.Id;

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    var body = {
      PortBindings: {
        '5000/tcp': [
          {
            HostIp: '0.0.0.0',
            HostPort: nextPort().toString()
          }
        ]
      }
    };

    container.start(context.runId, body, function(err) {
      if (err) {
        env.response.statusCode = 500;
        return context.next(context.env);
      }

      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    context.next(context.env);
  });

  pipeline.flow({ env: env, next: next });
};
