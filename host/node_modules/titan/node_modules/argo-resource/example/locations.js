var url = require('url');

var Locations = module.exports = function(proxyUrl) {
  this.proxyUrl = proxyUrl
    || 'https://api.usergrid.com/kevinswiber/sandbox/store-locations';
};

Locations.prototype.init = function(config) {
  config
    .path('/locations')
    .produces('application/json')
    .get('/', this.list)
    .get('/{id}', this.show)
};

Locations.prototype.list = function(handle) {
  var self = this;

  handle('request', function(env, next) {
    env.target.url = self.proxyUrl;
    next(env);
  });

  handle('response', function(env, next) {
    env.target.response.getBody(function(err, body) {
      if (err) {
        env.response.statusCode = 500;
        return next(env);
      }

      var body = JSON.parse(body.toString());

      var ret = body.entities.map(function(entity) {
        return {
          id: entity.storeNumber,
          description: entity.description
        };
      });

      env.response.statusCode = 200;
      env.response.body = ret;

      next(env);
    });
  });
};

Locations.prototype.show = function(handle) {
  var self = this;

  handle('request', function(env, next) {
    var id = env.route.params.id;

    var parsed = url.parse(self.proxyUrl, true);
    parsed.query = { ql: 'SELECT * WHERE storeNumber=' + id };

    env.target.url = url.format(parsed);

    next(env);
  });

  handle('response', function(env, next) {
    env.target.response.getBody(function(err, body) {
      if (err || !body) {
        env.response.statusCode = 500;
        return next(env);
      }

      var body = JSON.parse(body.toString());

      var ret = body.entities.map(function(entity) {
        return {
          id: entity.storeNumber,
          description: entity.description
        };
      });

      if (ret.length) {
        ret = ret[0];
        env.response.statusCode = 200;
        env.response.body = ret;
      } else {
        env.response.removeHeader('Content-Type');
        env.response.statusCode = 404;
        env.response.body = '';
      }


      next(env);
    });
  });
};
