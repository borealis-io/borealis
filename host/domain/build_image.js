var pipeworks = require('pipeworks');

var BuildImageFactory = module.exports = function(container, config, stdin, name) {
  this.container = container;
  this.config = config;
  this.stdin = stdin;
  this.name = name;
  this.buildImageName = 'build-' + this.name;
  this.id = null;
  this.client = null;
  this.steps = ['createContainer', 'attachStream', 'start', 'wait', 'commit']
};

BuildImageFactory.prototype.create = function(cb) {
  var pipeline = pipeworks();
  var self = this;
  var steps = ['createContainer', 'attachStream', 'start', 'wait', 'commit']
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
    cb(null, self.buildImageName);
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

  self.client.on('end', function() {
    cb();
  });

  this.container.start(this.id, function(err) {
    if (err) {
      return cb(err);
    }

    self.client.end();
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
