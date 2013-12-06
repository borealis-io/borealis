module.exports = function(handle) {
  handle('request', function(env, next) {
    var setup = env.pipeline('auth:basic:setup');
    if (!setup) {
      console.log('Basic auth is not enabled. Add a handler for auth:basic:setup.');
      return next(env);
    }

    setup.siphon(env, handleAuth(next));
  });
};

function handleAuth(next) {
  return function(env) {
    var auth;

    env.auth = env.auth || {};

    var authHeader = env.request.headers['authorization'];
    if (authHeader) {
      auth = authHeader.split(/\s/);
    }

    if (!auth || auth[0].toLowerCase() !== 'basic') {
      setError(env);
      next(env);
    } else {
      var credentials = new Buffer(auth[1], 'base64').toString().split(':');
      var username = credentials[0];
      var password = credentials[1];

      if (env.auth.authenticate) {
        env.auth.authenticate(username, password, function(err, user) {
          if (user) {
            env.auth.user = user;
            env.auth.isAuthenticated = true;

            next(env);
          } else {
            setError(env);
            next(env);
          }
        });
      } else {
        setError(env);
        next(env);
      }
    }
  }
}

function setError(env) {
  env.auth.isAuthenticated = false;
  env.response.statusCode = 401;
  env.response.setHeader('WWW-Authenticate', 'Basic Realm="'
      + (env.auth.realm || 'Realm') + '"');
};
