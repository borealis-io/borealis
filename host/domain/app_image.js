var AppImageFactory = module.exports = function(container, buildImageName, appName) {
  this.container = container;
  this.buildImageName = buildImageName;

  this.name = 'app-' + appName;

  this.id = null;

  this.steps = ['createContainer', 'start', 'wait', 'commit', 'clean'];
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
  this.container.commit(this.id, this.name, cb);
};

AppImageFactory.prototype.clean = function(cb) {
  this.container.remove(this.id, true, cb);
};
