var path = require('path');
var url = require('url');

module.exports = function(handle) {
  handle('request', function(env, next) {
    var uri = env.argo.uri();

    env.helpers = env.helpers || {};
    env.helpers.url = {};

    env.helpers.url.join = function(pathname) {
      var parsed = url.parse(uri);
      parsed.search = null;
      parsed.pathname = path.join(parsed.pathname, pathname);
      
      return url.format(parsed);
    };

    env.helpers.url.path = function(pathname) {
      var parsed = url.parse(uri);
      parsed.search = null;
      parsed.pathname = pathname;

      return url.format(parsed);
    };

    env.helpers.url.current = function() {
      return uri;
    };

    next(env);
  });
};
