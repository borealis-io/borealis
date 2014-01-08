var AppContainerFactory = require('../domain/app_container_factory');
var AppImageFactory = require('../domain/app_image_factory');
var BuildImageFactory = require('../domain/build_image_factory');
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
  var appName = env.route.params.name;
  var container = Container.create(server);
  var buildImageFactory = new BuildImageFactory(container, config, env.request, appName);

  var error = function(err) {
    throw err;
    env.response.statusCode = 500;
    return next(env);
  };

  buildImageFactory.create(function(err, buildImageName) {
    if (err) {
      return error(err);
    }

    var appImageFactory = new AppImageFactory(container, buildImageName, appName);
    appImageFactory.create(function(err, appImageName) {
      if (err) {
        return error(err);
      }
    
      var appContainerFactory = new AppContainerFactory(container, appImageName);
      appContainerFactory.create(function(err) {
        if (err) {
          return error(err);
        }

        next(env);
      });
    });
  });
};
