var url = require('url');

var UrlRouterResult = function() {
  this.warning = null;
  this.params = null;
  this.handlerFn = null;
};

var UrlRouter = function(argo) {
  this._argo = argo;
  this._router = [];
  this._routerKeys = [];

  if(argo) {
    argo
      .use(function(handle) {
        handle('request', { affinity: 'hoist' }, function(env, next){
          env.route = env.route || {};
          var parsed = url.parse(env.request.url, true);

          env.route.query = parsed.query;

          next(env);
        });
      });
  }
};

UrlRouter.prototype.install = function() {
  this._argo.router = this;
};

UrlRouter.prototype.add = function(path, options, handleFn) {
  if (!this._router[path]) {
    this._router[path] = {};
    this._routerKeys.push({ key: path, actsAsPrefix: options.actsAsPrefix });
  }

  var methods = options.methods || ['*'];

  var that = this;
  methods.forEach(function(method) {
    that._router[path][method.toLowerCase()] = handleFn;
  });
};

UrlRouter.prototype.find = function(path, method) {
  var routerKey;
  var found = false;
  var params = {};
  method = method.toLowerCase();

  path = url.parse(path).pathname || '/';

  var self = this;
  this._routerKeys.forEach(function(obj) {
    if (found || obj.key === '*') {
      return;
    }

    var parsed = self.parse(obj.key, obj.actsAsPrefix);
    var re = new RegExp(parsed.key);
    var testMatch = re.test(path);

    if (!routerKey && obj.key !== '*' && testMatch) {
      found = true;
      routerKey = obj.key;

      var result = re.exec(path);

      var names = parsed.captures;

      for (var i = 0; i < names.length; i++) {
        if (result[i+1]) {
          params[names[i]] = decodeURIComponent(result[i+1]);
        }
      }
    }
  });

  if (!routerKey && this._router['*']) {
    routerKey = '*';
  }

  if (routerKey &&
      (!this._router[routerKey][method] &&
       !this._router[routerKey]['*'])) {
    var result = new UrlRouterResult();
    result.warning = 'MethodNotSupported';
    return result;
  }

  if (routerKey &&
      (this._router[routerKey][method] ||
       this._router[routerKey]['*'])) {

    var fn = this._router[routerKey][method] ? this._router[routerKey][method] 
      : this._router[routerKey]['*'];

    var result = new UrlRouterResult();
    result.params = params;
    result.handlerFn = fn;
    return result;
  }

  var result = new UrlRouterResult();
  result.warning = 'NotFound';
  return result;
};

UrlRouter.prototype.truncate = function(path, prefix) {
  var pattern = this.parse(prefix).key;

  if (pattern !== '*') {
    if (pattern[0] !== '^') {
      pattern = '^' + pattern; // make sure it's a prefix
    }

    if (pattern.slice(-1) === '$') {
      pattern = pattern.slice(0, -1);
    }

    var re = new RegExp(pattern);

    return path.replace(re, '') || '/';
  } else {
    return path;
  }
};

UrlRouter.prototype.parse = function(route, actsAsPrefix) {
  if (route === '/') {
    return { captures: [], key: '^/$' };
  }


  var pattern = /\{([^\}]+)\}/g;
  
  var captures = [];
  var parts = [];
  var pos = 0;
  var part;

  while (part = pattern.exec(route)) {
    parts.push(route.slice(pos, part.index-1));

    var name = part[1];
    var expr = '/([^\/]+)';

    var isRegex = false;
    if (name.indexOf(':') !== -1) {
      var namePattern = /([^\:]+)\:\s(.*)$/;
      var result = namePattern.exec(name);
      name = result[1];
      expr = '/' + result[2];
      isRegex = true;
    }
    
    if (name.slice(-1) === '?') {
      name = name.slice(0, -1);
      expr = isRegex ? '(?:' + expr + ')?' : '(?:/([^\/]*))?';
    }

    captures.push(name);
    parts.push(expr);

    pos = part.index + part[0].length;
  };

  if (route.length > pos+1) {
    parts.push(route.substr(pos));
  }

  var path = parts.join('');

  if (actsAsPrefix) {
    if (path.slice(-1) === '$') {
      path = path.slice(0, -1);
    }
  } else {
    if (path.slice(-1) !== '$') {
      path = path + '$';
    }
  }

  if (path[0] !== '^') {
    path = '^' + path;
  }

  return { captures: captures, key: path };
};

UrlRouter.create = UrlRouter.prototype.create = function(argo) {
  return new UrlRouter(argo);
};

UrlRouter.package = function(argo) {
  var router = UrlRouter.create(argo);

  return {
    name: 'UrlRouter',
    install: router.install
  };
};

module.exports = {
  package: function(argo) {
    var router = UrlRouter.create(argo);
    return {
      name: 'UrlRouter',
      install: router.install.bind(router)
    };
  }
};
