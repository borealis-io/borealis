var pipeworks = require('pipeworks');
var http = require('http');
var qs = require('querystring');

var AppContainer = require('./app_container');
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

var BuildProcess = module.exports = function(options) {
  this.app = options.app;
  this.input = options.input;
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
    var appContainer = new AppContainer(container, context.appImage.name);
    var appContainerRunner = new StepRunner(appContainer);
    context.appContainer = appContainer;

    appContainerRunner.run(function(err){
      if(err) return cb(err);
      next(context);
    });
    
  });

  pipeline.fit(function(context, next) {
    var opts = {
      host:'172.17.0.15',
      port:8081,
      path:'/apps',
      method:'POST'
    };

    container.inspect(context.appContainer.id, function(err, body) {
      console.log('inspect');
      if(err) return cb(err);
      var containerInfo = JSON.parse(body);
      var containerIp = containerInfo.NetworkSettings.IpAddress;
      //hard coded for now.
      var port = '' + 5000;
      var host = context.appImage.name+'.labapp.io';
      var target = containerIp + ':' + port;
      var req = http.request(opts, function(res) {
        if(res.statusCode != 201) {
          return cb(new Error('Error adding app to router - ' + res.statusCode));
        }
        cb(null);
      });

      var data = qs.stringify({ host: host, target: target});
      
      req.on('error', function(e) {
        return cb(new Error('Problem adding app to router.'));
      });
      
      req.write(data);
      req.end();
    });
  });

  var context = new Context();
  pipeline.flow(context);
};
