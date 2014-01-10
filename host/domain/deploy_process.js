var pipeworks = require('pipeworks');

var AppContainer = require('./app_container');
var Container = require('../container');
var Routing = require('./routing');
var StepRunner = require('./step_runner');

var server = require('../config/server');

function Context() {
  this.appContainer = null;
  this.routing = null
}

var DeployProcess = module.exports = function(app, appImageName) {
  this.app = app;
  this.appImageName = appImageName;
};

DeployProcess.prototype.execute = function(cb) {
  var pipeline = pipeworks();
  var container = Container.create(server);

  var self = this;

  pipeline.fit(function(context, next) {
    context.appContainer = new AppContainer(container, self.appImageName);
    var appContainerRunner = new StepRunner(context.appContainer);

    appContainerRunner.run(function(err) {
      if (err) return cb(err);
      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    context.routing = new Routing(container, self.app, context.appContainer.id);
    var routingRunner = new StepRunner(context.routing);

    routingRunner.run(function(err) {
      if (err) return cb(err);
      next(context);
    });
  });

  pipeline.fit(function(context, next) {
    cb();
  });

  var context = new Context();
  pipeline.flow(context);
};
