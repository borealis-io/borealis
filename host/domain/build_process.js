var pipeworks = require('pipeworks');

var AppImage = require('./app_image');
var BuildImage = require('./build_image');
var Container = require('../container');
var StepRunner = require('./step_runner');

var config = require('../config/build_container');
var server = require('../config/server');

function Context() {
  this.buildImage = null;
  this.appImage = null;
}

var BuildProcess = module.exports = function(app, input) {
  this.app = app;
  this.input = input;
};

BuildProcess.prototype.execute = function(cb) {
  var pipeline = pipeworks();
  var container = Container.create(server);

  var self = this;

  pipeline.fit(function(context, next) {
    context.buildImage = new BuildImage(container, config, self.input, self.app);
    var buildImageRunner = new StepRunner(context.buildImage);

    buildImageRunner.run(function(err) {
      if (err) return cb(err);
      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    context.appImage = new AppImage(container, context.buildImage.name, self.app);
    var appImageRunner = new StepRunner(context.appImage);

    appImageRunner.run(function(err) {
      if (err) return cb(err);
      next(context);
    })
  });

  pipeline.fit(function(context, next) {
    cb(null, context.appImage.name);
  });

  var context = new Context();
  pipeline.flow(context);
};
