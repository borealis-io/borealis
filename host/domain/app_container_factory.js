var pipeworks = require('pipeworks');

var AppContainer = module.exports = function(container, appImageName) {
  this.container = container;
  this.appImageName = appImageName;
  this.id = null;
};

AppContainer.prototype.create = function(cb) {
  var pipeline = pipeworks();
  var self = this;
  var steps = ['createContainer', 'start'];
  
  steps.forEach(function(step) {
    pipeline.fit(function(context, next) {
      self[step].call(self, function(err) {
        if (err) {
          cb(err);
        } else {
          next(context);
        }
      });
    });
  });

  pipeline.fit(function() {
    cb(null, self.appImageName);
  });

  pipeline.flow();
};

AppContainer.prototype.createContainer = function(cb) {
  var config = {
    Image: this.appImageName,
    Cmd: ['/app/bin/node', '/app'],
    Env: ['PORT=5000'],
  };

  var self = this;
  this.container.create(config, function(err, body) {
    if (!body || err) {
      return cb(err);
    }

    body = JSON.parse(body.toString());

    self.id = body.Id;

    cb();
  });
};

AppContainer.prototype.start = function(cb) {
  var body = {
    PortBindings: {
      '5000/tcp': [
        {
          HostPort: '0'
        }
      ]
    }
  };

  this.container.start(this.id, body, cb);
};
