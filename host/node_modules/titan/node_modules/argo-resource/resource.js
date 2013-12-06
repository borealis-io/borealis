var Negotiator = require('negotiator');
var pipeworks = require('pipeworks');

var SupportedMethods = ['get','put','patch','post','del','options','trace'];

var ResourceConfig = function() {
  this.$path = '/';
  this.$maps = [];
  this.$produces = [];
  this.$consumes = [];

  var self = this;
  SupportedMethods.forEach(function(m) {
    var key = '$' + m + 's';
    self[key] = [];
  });

  this.thisArg = null;
};

ResourceConfig.prototype.path = function(path) {
  if (path !== '*' && path[0] !== '/') {
    path = '/' + path;
  }

  this.$path = path;
  return this;
};

ResourceConfig.prototype.map = function(path, fn, methods, thisArg) {
  if (typeof path === 'function') {
    fn = path;
    options = fn;
    thisArg = options;
    path = '/';
  }

  if (!Array.isArray(methods)) {
    thisArg = methods;
    methods = ['GET'];
  }

  if (path[0] !== '/') {
    path = '/' + path;
  }

  this.$maps.push({ path: path, methods: methods, thisArg: thisArg, handler: fn });
  return this;
};

SupportedMethods.forEach(function(m) {
  ResourceConfig.prototype[m] = function(path, fn, opts) {
    var hasOpts = false;

    if (typeof opts === 'object') {
      hasOpts = true;
    } else {
      opts = {};
    }

    var obj = {
      path: path,
      consumes: opts.consumes || [],
      produces: opts.produces || [],
      thisArg: opts.bind,
      handler: fn
    };

    if (hasOpts) {
      Object.keys(opts).forEach(function(key) {
        obj[key] = opts[key];
      });
    }

    /*if (typeof path === 'function') {
      obj.thisArg = fn;
      obj.handler = path;
      obj.path = '/';
    } else if (typeof path === 'object') {
      Object.keys(path).forEach(function(key) {
        if (path.hasOwnProperty(key)) {
          obj[key] = path[key];
        }
      });
      obj.thisArg = obj.bind;
    }

    if (typeof fn === 'object') {
      Object.keys(fn).forEach(function(key) {
        if (path.hasOwnProperty(key)) {
          obj[key] = path[key];
        }
      });
      obj.thisArg = thisArg || obj.bind;
      obj.path = path;
    }

    if (!obj.path || typeof obj.path !== 'string') {
      obj.path = '/';
    }*/

    if (obj.path[0] !== '/') {
      obj.path = '/' + obj.path;
    }

    var key = '$' + m + 's';

    this[key].push(obj);

    return this;
  };
});

ResourceConfig.prototype.produces = function(mediaTypes) {
  if (typeof mediaTypes === 'string') {
    this.$produces.push(mediaTypes);
  } else if (Array.isArray(mediaTypes)) {
    this.$produces.concat(mediaTypes);
  }

  return this;
};

ResourceConfig.prototype.consumes = function(mediaTypes) {
  if (typeof mediaTypes === 'string') {
    this.$consumes.push(mediaTypes);
  } else if (Array.isArray(mediaTypes)) {
    this.$consumes.concat(mediaTypes);
  }

  return this;
};

ResourceConfig.prototype.bind = function(thisArg) {
  this.thisArg = thisArg
  return this;
};

ResourceConfig.create = function(cons) {
  return new ResourceConfig();
};

var ResourceInstaller = function(config, obj) {
  this.config = config;
  this.obj = obj;
};

ResourceInstaller.prototype.install = function(argo) {
  var config = this.config;
  var obj = this.obj;

  var self = this;

  if (config.$path === '/') {
    config.$path = '*';
  }
  argo
    .map(config.$path, function(server) {
      server.use(function(handle) {
        handle('request', function(env, next) {
          env.resource = {
            _skipHandler: false,
            config: config,
            current: null,
            _skip: false,
            skip: function(bool) { env.resource._skip = bool; }
          };
          next(env);
        });
      });

      config.$maps.forEach(function(obj) {
        var thisArg = obj.thisArg || config.thisArg;
        server.map(obj.path, { methods: obj.methods }, obj.handler.bind(thisArg));
      });

      SupportedMethods.forEach(function(m) {
        var key = '$' + m + 's';
        config[key].forEach(function(obj) {
          var thisArg = ((obj.thisArg || config.thisArg) || self.obj);
          var consumes = obj.consumes.length ? obj.consumes : config.$consumes;
          var produces = obj.produces.length ? obj.produces : config.$produces;
          var handler = obj.handler.bind(thisArg);

          var isHandler = (obj.handler.length === 1)/* function(handle) */;

          if (isHandler) {
            var hijacker = function(handle) {
              handler(function(type, options, fn) {
                if (typeof options === 'function') {
                  fn = options;
                  options = null;
                }

                if (type === 'request') {
                  var wrapper = self._setupRequest(obj, fn, produces, consumes);
                  handle(type, options, wrapper);
                } else if (type === 'response') {
                  var wrapper = function(env, next) {
                    if (env.resource._skip) {
                      next(env);
                    } else {
                      if (env.resource.responseType && !env.response.getHeader('Content-Type')) {
                        env.response.setHeader('Content-Type', env.resource.responseType);
                      }
                      fn(env, next);
                    }
                  };

                  handle(type, options, wrapper);
                } else {
                  handle(type, options, fn);
                }
              });
            };

            server[m](obj.path, hijacker);
          } else {
            var oldObj = obj;
            server[m](obj.path, function(handle) {
              var obj = {};

              Object.keys(oldObj).forEach(function(key) {
                obj[key] = oldObj[key];
              });

              handle('request', self._setupRequest(obj, handler, produces, consumes));
              handle('response', function(env, next) {
                if (env.resource.responseType && !env.response.getHeader('Content-Type')) {
                  env.response.setHeader('Content-Type', env.resource.responseType);
                }
                next(env);
              });
            });
          }
        });
      });
    });
};

ResourceInstaller.prototype._setupRequest = function(obj, handler, produces, consumes) {
  obj.produces = produces;
  obj.consumes = consumes;

  return function(env, next) {
    var pipeline = pipeworks()
      .fit(function(context, next) {
        context.env.resource.next = context.next;
        context.env.resource.current = context.obj;
        context.env.resource.handler = context.handler;

        var pre = context.env.pipeline('resource:request:before');
        if (pre) {
          pre.siphon(context.env, function(env) {
            context.env = env;
            context.obj = env.resource.current;
            context.next = env.resource.next;
            context.handler = env.resource.handler;
            context.produces = env.resource.current.produces;
            context.consumes = env.resource.current.consumes;
            next(context);
          });
        } else {
          next(context);
        }
      })
      .fit(function(context, next) {
        if (context.env.resource._skip) {
          return next(context);
        }

        if (!context.env.resource.responseType) {
          var negotiator = new Negotiator(context.env.request);
          var preferred = negotiator.preferredMediaType(context.produces) || context.produces[0];
          context.env.resource.responseType = preferred;
        }

        if (context.env.resource.requestType) {
          return context.handler(context.env, function(env) {
            context.env = env;
            context.obj = env.resource.current;
            context.next = env.resource.next;
            context.handler = env.resource.handler;
            next(context);
          });
        }

        var methods = ['PUT', 'POST', 'PATCH'];
        if (methods.indexOf(context.env.request.method) !== -1) {
          if (context.env.request.headers['content-type'] && context.consumes
              && context.consumes.indexOf(context.env.request.headers['content-type']) == -1) {
            context.env.response.statusCode = 415;
            context.env.resource.error = { message: 'Unsupported Media Type', supported: context.consumes };

            return next(context);
          } else {
            context.env.resource.requestType = env.request.headers['content-type'];
          }
        }

        context.handler(context.env, function(env) {
          context.env = env;
          context.obj = env.resource.current;
          context.next = env.resource.next;
          context.handler = env.resource.handler;
          next(context);
        });
      })
      .fit(function(context, next) {
        var post = context.env.pipeline('resource:request:after');
        if (post) {
          post.siphon(context.env, function(env) {
            context.env = env;
            context.obj = env.resource.current;
            context.next = env.resource.next;
            context.handler = env.resource.handler;
            next(context);
          });
        } else {
          next(context);
        }
      })
      .fit(function(context, next) {
        context.next(context.env);
      });

    var context = { env: env, next: next, obj: obj, handler: handler, produces: produces, consumes: consumes };
    pipeline.flow(context);
  }
};

module.exports = function(/* constructor, ...constructorArgs */) {
  var args = Array.prototype.slice.call(arguments);

  var constructor = args[0];
  var constructorArgs = args.length > 1 ? args.slice(1) : undefined;

  var pkg = function(argo) {
    var obj;

    if (constructor.prototype) {
      obj = Object.create(constructor.prototype);
      obj.constructor.apply(obj, constructorArgs);
    } else if (constructor.init) {
      obj = constructor;
    }

    if (!obj.init) {
      throw new Error('Resource is missing an init function.');
    }

    var config = ResourceConfig.create();
    obj.init(config);

    var installer = new ResourceInstaller(config, obj);

    return {
      name: 'resource',
      install: installer.install.bind(installer, argo)
    };
  };

  return { package: pkg };
};
