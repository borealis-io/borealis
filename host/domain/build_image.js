var BuildImage = module.exports = function(container, config, stdin, name) {
  this.container = container;
  this.config = config;
  this.stdin = stdin;
  this.name = name;

  this.name = 'build-' + this.name;

  this.id = null;
  this.client = null;

  this.steps = ['createContainer', 'attachStream', 'start', 'wait', 'commit', 'clean']
};

BuildImage.prototype.createContainer = function(cb) {
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

BuildImage.prototype.attachStream = function(cb) {
  var self = this;

  this.container.attach(this.id, this.stdin, function(err, client) {
    if (err) {
      return cb(err);
    }

    self.client = client;

    cb();
  });
};

BuildImage.prototype.start = function(cb) {
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

BuildImage.prototype.wait = function(cb) {
  this.container.wait(this.id, function(err) {
    if (err) {
      return cb(err);
    }

    cb();
  });
};

BuildImage.prototype.commit = function(cb) {
  this.container.commit(this.id, this.name, function(err, id) {
    if (err) {
      return cb(err);
    }

    cb();
  });
};

BuildImage.prototype.clean = function(cb) {
  this.container.remove(this.id, true, function(err) {
    if (err) {
      return cb(err);
    }

    cb();
  });
};
