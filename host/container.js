var http = require('http');
var net = require('net');

function buffer(stream, callback) {
  if (stream.body !== null && stream.body !== undefined) {
    return callback(null, stream.body);
  }

  if (!stream.readable) {
    return callback();
  }

  var buf = [];
  var len = 0;
  var body;

  stream.on('readable', function() {
    var chunk;

    while ((chunk = stream.read()) != null) {
      buf.push(chunk);
      len += chunk.length;
    }

    if (!buf.length) {
      return;
    }

    if (buf.length && Buffer.isBuffer(buf[0])) {
      body = new Buffer(len);
      var i = 0;
      buf.forEach(function(chunk) {
        chunk.copy(body, i, 0, chunk.length);
        i += chunk.length;
      });
    } else if (buf.length) {
      body = buf.join('');
    }
  });

  var error = null;
  stream.on('error', function(err) {
    error = err;
  });

  stream.on('end', function() {
    stream.body = body;
    callback(error, body);
  });

  if (typeof stream.read === 'function') {
    stream.read(0);
  }
};

var Container = module.exports = function(server) {
  this.server = server;
};

Container.prototype._configure = function(options) {
  options.path = '/' + this.server.version + options.path;
  options.socketPath = this.server.path;

  return options;
};

Container.prototype.create = function(config, cb) {
  var options = this._configure({
    method: 'POST',
    path: '/containers/create',
    headers: { 'Content-Type': 'application/json' }
  });

  var req = http.request(options, function(res) {
    if (res.statusCode != 201) {
      return cb(new Error('Unable to create build container - ' + res.statusCode));
    }

    buffer(res, cb);
  })

  var body = config;

  req.write(JSON.stringify(body));
  req.end();
};


Container.prototype.attach = function(id, input, cb) {
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
      input.pipe(client);
    });

    client.on('finish', function() {
      cb(null, client);
    });
  });
};

Container.prototype.inspect = function(id, cb) {
  var options = this._configure({
    method:'GET', 
    path: '/containers/'+ id + '/json'
  });
  console.log('inspect');

  var req = http.request(options, function(res) {
    console.log('inspect');

    buffer(res, cb);
  });

  req.end();
};

Container.prototype.start = function(id, body, cb) {
  if (typeof body === 'function') {
    cb = body;
    body = null;
  }

  var contentType = body ? 'application/json' : 'text/plain';

  if (typeof body === 'object') {
    body = JSON.stringify(body);
  }

  var options = this._configure({
    method: 'POST',
    path: '/containers/' + id + '/start',
    headers: { 'Content-Type': contentType },
  });

  var cbCalled = false;
  var req = http.request(options, function(res) {
    if (res.statusCode === 404) {
      cbCalled = true;
      return cb(new Error('Unable to start build container - container does not exist'));
    } else if (res.statusCode === 500) {
      cbCalled = true;
      return cb(new Error('Unable to start container - server error'));
    }

    cbCalled = true;
    cb();
  });

  req.on('error', function(err) {
    if (err.code === 'ECONNRESET') {
      return;
    }
    cbCalled = true;
    cb(err);
  });

  req.on('end', function() {
    cbCalled = true;
    cb();
  });

  if (body) {
    req.write(body);
  }

  req.end();
};

Container.prototype.wait = function(id, cb) {
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

    buffer(res, function(err, body) {
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

Container.prototype.commit = function(id, image, cb) {
  var options = this._configure({
    method: 'POST',
    path: '/commit',
    headers: { 'Content-Type': 'text/plain' }
  });

  options.path = options.path + '?container=' + id + '&repo=' + image;

  var req = http.request(options, function(res) {
    if (res.statusCode === 404) {
      return cb(new Error('Unable to wait a commit container - container does not exist'));
    } else if (res.statusCode === 500) {
      return cb(new Error('Unable to wait a commit container - server error'));
    }

    buffer(res, function(err, body) {
      body = JSON.parse(body.toString());

      cb(null, body.Id);
    });
  });

  req.end();
};

Container.create = function(server) {
  return new Container(server);
};
