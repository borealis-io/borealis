var pipeworks = require('pipeworks');

var BuildImageFactory = module.exports = function(container, config, stdin, name) {
  this.container = container;
  this.config = config;
  this.stdin = stdin;
  this.name = name;
  this.buildImageName = 'build-' + this.name;
  this.id = null;
  this.client = null;
};

BuildImageFactory.prototype.create = function(cb) {
  var pipeline = pipeworks();
  var self = this;
  var steps = ['createContainer', 'attachStream', 'start', 'wait', 'commit']
  steps.forEach(function(step) {
    console.log('fitting', step);
    pipeline.fit(function(context, next) {
      console.log('calling', step);
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
    cb(self.buildImageName);
  });

  pipeline.flow();
};

BuildImageFactory.prototype.createContainer = function(cb) {
  var self = this;

  this.container.create(this.config, function(err, body) {
    if (err) {
      return cb(err);
    }

    body = JSON.parse(body.toString());
    self.id = body.Id;

    cb();
  });
};

BuildImageFactory.prototype.attachStream = function(cb) {
  var self = this;

  this.container.attach(this.id, this.stdin, function(err, client) {
    if (err) {
      return cb(err);
    }

    self.client = client;

    cb();
  });
};

BuildImageFactory.prototype.start = function(cb) {
  var self = this;

  this.container.start(this.id, function(err) {
    console.log('attempting to start container...');
    if (err) {
      return cb(err);
    }

    console.log('starting build image');

    self.client.end();

    cb();
  });
};

BuildImageFactory.prototype.wait = function(cb) {
  this.container.wait(this.id, function(err) {
    if (err) {
      return cb(err);
    }

    cb();
  });
};

BuildImageFactory.prototype.commit = function(cb) {
  this.container.commit(this.id, this.buildImageName, function(err, id) {
    if (err) {
      return cb(err);
    }

    cb();
  });
};
