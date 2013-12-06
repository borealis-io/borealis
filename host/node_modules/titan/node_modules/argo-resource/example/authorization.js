module.exports = function(handle) {
  handle('resource:request:before', function(env, next) {
    var action = env.resource.current.action;

    if (!env.auth.isAuthenticated) {
      env.resource.skip(true);
      next(env);
    } else if (action && env.auth.user) {
      if (!env.auth.user.actions
          || env.auth.user.actions.indexOf(action) === -1) {
        env.resource.skip(true);

        env.response.statusCode = 403;
        env.resource.forbidden = action;
        next(env);
      } else {
        next(env);
      }
    } else {
      next(env);
    }
  });
};
