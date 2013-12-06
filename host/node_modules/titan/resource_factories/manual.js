var resource = require('argo-resource');

var ManualResourceFactory = module.exports = function() {
  this.resources = [];
};

ManualResourceFactory.prototype.register = function() {
  var args = Array.prototype.slice.call(arguments);
  this.resources.push(args);
};

ManualResourceFactory.prototype.resolve = function() {
  return this.resources.map(function(args) {
    return resource.apply(null, args);
  });
};
