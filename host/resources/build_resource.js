var BuildProcess = require('../domain/build_process');

var BuildResource = module.exports = function() {
};

BuildResource.prototype.init = function(config) {
  config
    .path('/builds')
    .post('/{name}', this.create, { consumes: ['application/x-tar'] });
};

BuildResource.prototype.create = function(env, next) {
  var options = {
    input: env.request,
    app: env.route.params.name
  };

  var buildProcess = new BuildProcess(options);

  buildProcess.execute(function(err) {
    if (err) {
      env.response.statusCode = 500;
      return next(env);
    }

    next(env);
  });
};
