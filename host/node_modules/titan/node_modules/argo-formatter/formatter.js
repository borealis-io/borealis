var path = require('path');

module.exports = function(options) {
  options = options || {};

  var directory = options.directory || path.join(process.cwd(), '/formats');

  var engines = options.engines || [];

  var override = options.override || {};

  var formats = [];
  var map = {};

  engines.forEach(function(formatter) {
    formats.push({
      name: formatter.name,
      mediaTypes: formatter.mediaTypes,
      extension: formatter.extension,
      subdirectory: formatter.subdirectory
    });

    map[formatter.name] = formatter;
  });

  var findFormatter = function(type) {
    var found = null;
    formats.forEach(function(format) {
      if (!found && format.mediaTypes.indexOf(type) !== -1) {
        found = map[format.name];
      }
    });

    return found;
  };

  return function(handle) {
    handle('request', function(env, next) {
      env.format = {
        name: null,
        locals: null,
        render: function(name, locals) {
          env.format.name = name;
          env.format.locals = locals;
        }
      };

      next(env);
    });

    handle('response', function(env, next) {
      if (!env.format.name) {
        return next(env);
      }

      var formatter;
      var type = (env.resource && env.resource.responseType)
                 ? env.resource.responseType
                 : env.response.getHeader('content-type');

      if (override.hasOwnProperty(type)) {
        formatter = override[type];
      } else {
        formatter = findFormatter(type);
      }

      if (!formatter) {
        return next(env);
      }

      var filename = path.join(directory, ('/' + formatter.subdirectory) || '',
          '/' + env.format.name + formatter.extension);

      env.response.body = formatter.format(filename, env.format.locals, function(err, body) {
        if (err) {
          console.error(err.stack);
          env.response.statusCode = 500;
          next(env);
        } else {
          env.response.body = body;
          next(env);
        }
      });
    });
  };
};
