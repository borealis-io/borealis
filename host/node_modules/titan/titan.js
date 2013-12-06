var fs = require('fs');
var path = require('path');
var argo = require('argo');
var formatter = require('argo-formatter');
var gzip = require('argo-gzip');
var logger = require('argo-clf');
var router = require('argo-url-router');
var resource = require('argo-resource');
var urlHelper = require('argo-url-helper');

var ContainerResourceFactory = require('./resource_factories/container');
var DirectoryResourceFactory = require('./resource_factories/directory');
var ManualResourceFactory = require('./resource_factories/manual');

var Titan = function() {
  this.argo = argo();
  this.formatter = null;

  this.resourceFactory = new ManualResourceFactory();

  this.argo
    .use(router)
    .use(urlHelper);
};

['use', 'route', 'map', 'build', 'get', 'post',
 'put', 'patch', 'delete', 'options', 'trace'].forEach(function(f) {
  Titan.prototype[f] = function() {
    var args = Array.prototype.slice.call(arguments);
    this.argo[f].apply(this.argo, args);
    return this;
  };
});

Titan.prototype.build = function() {
  this._wire();
  var args = Array.prototype.slice.call(arguments);
  return this.argo.build.apply(this.argo, args);
};

Titan.prototype.listen = function() {
  this._wire();
  var args = Array.prototype.slice.call(arguments);
  this.argo.listen.apply(this.argo, args);
  return this;
};

Titan.prototype.add = function() {
  if (!(this.resourceFactory instanceof ManualResourceFactory)) {
    this.resourceFactory = new ManualResourceFactory();
  }

  var args = Array.prototype.slice.call(arguments);
  this.resourceFactory.register.apply(this.resourceFactory, args);

  return this;
};

Titan.prototype.format = function(options) {
  if (!options.directory) {
    options.directory = path.join(path.dirname(require.main.filename), '/formats');
  }

  this.formatter = formatter(options);
  this.argo.use(this.formatter);
  return this;
};

Titan.prototype.allow = function(options) {
  options = options || {};

  if (options === '*') {
    options = {
      methods: ['DELETE', 'PUT', 'PATCH'],
      origins: ['*'],
      maxAge: '432000'
    };
  }
  
  this.argo.use(function(handle) {
    handle('response', function(env, next) {
      if (options.origins) {
        env.response.setHeader('Access-Control-Allow-Origin', options.origins.join(', '));
      }

      if (env.request.method === 'OPTIONS') {
        if (env.response.statusCode == 405) {
          env.response.statusCode = 200;
          env.response.body = null;
        }

        if (options.headers) {
          env.response.setHeader('Access-Control-Allow-Headers', options.headers.join(', '));
        }

        if (options.methods) {
          env.response.setHeader('Access-Control-Allow-Methods', options.methods.join(', '));
        }

        if (options.maxAge) {
          env.response.setHeader('Access-Control-Max-Age', options.maxAge);
        }
      }

      next(env);
    });
  });

  return this;
};

Titan.prototype.compress = function() {
  this.argo.use(gzip);
  return this;
};

Titan.prototype.logger = function() {
  this.argo.use(logger);
  return this;
};

Titan.prototype.load = function(factory) {
  if (!factory || typeof factory === 'string') {
    var opts = { directory: factory };
    factory = new DirectoryResourceFactory(opts);
  };

  this.resourceFactory = factory;
  return this;
};

Titan.prototype.error = function(handler) {
  this.argo.use(function(handle) {
    handle('error', handler);
  });

  return this;
};

Titan.prototype._wire = function() {
  var self = this;
  this.resourceFactory.resolve().forEach(function(res) {
    self.argo.use(res);
  });
};

var titan = module.exports = function(options) {
  var titan = new Titan(options);
  return titan;
};

titan.DirectoryResourceFactory = DirectoryResourceFactory;
titan.ContainerResourceFactory = ContainerResourceFactory;
