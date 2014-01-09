var AppContainer = require('./app_container');
var AppImage = require('./app_image');
var BuildImage = require('./build_image');
var Container = require('../container');
var StepRunner = require('./step_runner');

var config = require('../config/build_container');
var server = require('../config/server');

var BuildProcess = module.exports = function(options) {
  this.app = options.app;
  this.input = options.input;
};

BuildProcess.prototype.execute = function(cb) {
  var container = Container.create(server);

  buildImage = new BuildImage(container, config, this.input, this.app);
  var buildImageRunner = new StepRunner(buildImage);

  var self = this;
  buildImageRunner.run(function(err) {
    if (err) return cb(err);
    var appImage = new AppImage(container, buildImage.name, self.app);
    var appImageRunner = new StepRunner(appImage);

    appImageRunner.run(function(err) {
      if (err) return cb(err);

      var appContainer = new AppContainer(container, appImage.name);
      var appContainerRunner = new StepRunner(appContainer);

      appContainerRunner.run(cb);
    });
  });
};
