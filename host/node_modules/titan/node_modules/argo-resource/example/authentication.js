module.exports = function(handle) {
  handle('auth:basic:setup', function(env, next) {
    env.auth = env.auth || {};
    env.auth.realm = 'Store';
    env.auth.authenticate = function(username, password, cb) {
      if (username === 'kevin' && password === 'swiber') {
        var user = {
          username: username,
          actions: ['products:list', 'products:create', 'products:show', 'products:update']
        };

        cb(null, user);
      } else {
        cb();
      }
    };

    next(env);
  });
};
