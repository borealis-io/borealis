var pipeworks = require('pipeworks');

var AppImageFactory = module.exports = function(container, buildImageName, appName) {
  this.container = container;
  this.buildImageName = buildImageName;
  this.appImageName = 'app-' + appName;
  this.id = null;
};

AppImageFactory.prototype.create = function(cb) {
  var pipeline = pipeworks();
  var self = this;
  var steps = ['createContainer', 'start', 'wait', 'commit'];
  
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

AppImageFactory.prototype.createContainer = function(cb) {
  var config = {
    Image: this.buildImageName,
    Cmd: ['/build/builder']
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

AppImageFactory.prototype.start = function(cb) {
  this.container.start(this.id, cb);
};

AppImageFactory.prototype.wait = function(cb) {
  this.container.wait(this.id, cb);
};

AppImageFactory.prototype.commit = function(cb) {
  this.container.commit(this.id, this.appImageName, cb);
};
