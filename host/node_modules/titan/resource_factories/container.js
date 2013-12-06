var resource = require('argo-resource');

var ContainerResourceFactory = module.exports = function(container) {
  this.container = container;
};

ContainerResourceFactory.prototype.setContainer = function(container) {
  this.container = container;
};

ContainerResourceFactory.prototype.resolve = function() {
  var names = Object.keys(this.container.entries);

  var self = this;
  return names.filter(function(name) {
    var prefix = 'resource:';
    return name.substr(0, prefix.length) === prefix;
  }).map(function(name) {
    var res = self.container.resolve(name);
    return resource(res);
  });
};

ContainerResourceFactory.create = function(container) {
  return new ContainerResourceFactory(container);
};
