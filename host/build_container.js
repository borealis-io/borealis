var http = require('http');
var net = require('net');
var config = require('./config/build_container');

var BuildContainer = module.exports = function(server) {
  this.server = server;
};

BuildContainer.prototype._configure = function(options) {
  options.path = '/' + this.server.version + options.path;
  options.socketPath = this.server.path;

  return options;
};

BuildContainer.prototype.create = function(env, cb) {
  var options = this._configure({
    method: 'POST',
    path: '/containers/create',
    headers: { 'Content-Type': 'application/json' }
  });

  var req = http.request(options, function(res) {
    if (res.statusCode != 201) {
      env.response.statusCode = 500;
      return cb(new Error('Unable to create build container - ' + res.statusCode));
    }

    env.response.getBody.call(res, cb);
  })

  var body = config;

  req.write(JSON.stringify(body));
  req.end();
};


BuildContainer.prototype.attach = function(env, id, cb) {
  var options = this._configure({
    method: 'POST',
    path: '/containers/' + id + '/attach',
    headers: { 'Content-Type': 'application/vnd.docker.raw-stream' },
    query: { stdin: 1, stream: 1 }
  });

  var client = net.connect({ path: this.server.path });

  client.on('error', function(err) {
    cb(err);
  });

  client.on('connect', function() {
    client.write('POST /v1.7/containers/' + id + '/attach?stdin=1&stream=1 HTTP/1.1\r\n' +
                 'Content-Type: application/vnd.docker.raw-stream\r\n\r\n');

    client.on('data', function(data) {
      env.request.pipe(client);
    });

    client.on('finish', function() {
      cb(null, client);
    });
  });
};

BuildContainer.prototype.start = function(env, id, cb) {
  var options = this._configure({
    method: 'POST',
    path: '/containers/' + id + '/start',
    headers: { 'Content-Type': 'text/plain' },
  });

  var req = http.request(options, function(res) {
    if (res.statusCode === 404) {
      return cb(new Error('Unable to start build container - container does not exist'));
    } else if (res.statusCode === 500) {
      return cb(new Error('Unable to start container - server error'));
    }

    cb();
  });

  req.on('error', cb);

  req.end();
};

BuildContainer.prototype.wait = function(env, id, cb) {
  var options = this._configure({
    method: 'POST',
    path: '/containers/' + id + '/wait',
    headers: { 'Content-Type': 'text/plain' },
  });

  var req = http.request(options, function(res) {
    if (res.statusCode === 404) {
      return cb(new Error('Unable to wait a build container - container does not exist'));
    } else if (res.statusCode === 500) {
      return cb(new Error('Unable to wait a build container - server error'));
    }

    env.response.getBody.call(res, function(err, body) {
      body = JSON.parse(body.toString());

      var code = body.StatusCode;

      if (code !== 0) {
        cb(new Error('Unable to execute build container - ' + code));
      } else {
        cb()
      }
    });
  });

  req.end();
};

BuildContainer.create = function(server) {
  return new BuildContainer(server);
};
