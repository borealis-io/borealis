var BuildProcess = require('../domain/build_process');
var DeployProcess = require('../domain/deploy_process');

var BuildResource = module.exports = function() {
};

BuildResource.prototype.init = function(config) {
  config
    .path('/builds')
    .post('/{name}', this.create, { consumes: ['application/x-tar'] });
};

BuildResource.prototype.create = function(env, next) {
  var app = env.route.params.name;
  var input = env.request;

  var buildProcess = new BuildProcess(app, input);

  buildProcess.execute(function(err, appImageName) {
    if (err) {
      throw err;
      env.response.statusCode = 500;
      return next(env);
    }

    var deployProcess = new DeployProcess(app, appImageName);

    deployProcess.execute(function(err) {
      if (err) {
        throw err;
        env.response.statusCode = 500;
        return next(env);
      }

      env.response.statusCode = 200;

      next(env);
    });
  });
};
