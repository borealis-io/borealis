var path = require('path');
var Products = require('./products');

var ResourceDoc = function() {
  this.$path = '/';
  this.$produces = [];
  this.$consumes = [];
  this.$configs = [];
};

ResourceDoc.prototype.path = function(path) {
  this.$path = path;
  return this;
};

ResourceDoc.prototype.produces = function(type) {
  this.$produces.push(type);
  return this;
};

ResourceDoc.prototype.consumes = function(type) {
  this.$consumes.push(type);
  return this;
};

['get', 'post', 'put', 'del'].forEach(function(m) {
  ResourceDoc.prototype[m] = function(path, fn, opts) {
    var method = (m === 'del') ? 'DELETE' : m.toUpperCase();

    var config = {
      method: method,
      path: path,
      options: opts
    }

    if (opts.consumes) {
      config.consumes = opts.consumes;
      delete opts.consumes;
    }

    if (opts.produces) {
      config.produces = opts.produces;
      delete opts.produces;
    }

    this.$configs.push(config);
    return this;
  };
});

ResourceDoc.prototype.generate = function() {
  var configs = [];

  var self = this;
  this.$configs.forEach(function(config) {
    if (self.$path) {
      config.path = path.join(self.$path, config.path);
      if (config.path.slice(-1) === '/') {
        config.path = config.path.slice(0, -1);
      }
    }

    if (self.$consumes && !config.consumes) {
      config.consumes = self.$consumes;
    }

    if (self.$produces && !config.produces) {
      config.produces = self.$produces;
    }

    configs.push(config);
  });

  return configs;
};

var doc = new ResourceDoc();

var products = new Products();

products.init(doc);

console.log(doc.generate());
