var assert = require("assert"),
	Stream = require("stream"),
	util = require("util"),
	argo = require("argo"),
	zlib = require("zlib"),
  fs = require("fs"),
	argo_gzip = require("../");

//Mocks

function Request() {
  this.headers = {};
  this.chunks = [];
  Stream.Duplex.call(this);
}
util.inherits(Request, Stream.Duplex);

Request.prototype._read = function(size) {
  var chunk = this.chunks.length ? this.chunks.shift() : null;
  this.push(chunk);
};

Request.prototype._write = function(chunk, encoding, callback) {
  this.chunks.push(chunk);
  callback();
};

function Response() {
  this.headers = {};
  this.statusCode = 0;
  this.body = null;
  this.chunks = [];
  Stream.Duplex.call(this);
}
util.inherits(Response, Stream.Duplex);

Response.prototype._read = function(size) {
  var chunk = this.chunks.length ? this.chunks.shift() : null;
  this.push(chunk);
};

Response.prototype._write = function(chunk, encoding, callback) {
  this.chunks.push(chunk);
  callback();
};

Response.prototype.setHeader = function(k, v) {
  this.headers[k] = v;
};

Response.prototype.writeHead = function(s, h) {
  this.statusCode = s;
  this.headers = h;
}

Response.prototype.getHeader = function(k) {
  return this.headers[k];
};

Response.prototype.end = function(b) {
  this.body = b;
};

function _getEnv() {
  return { 
    request: new Request(),
    response: new Response(),
    target: {},
    argo: {}
  };
}

//TESTS

describe("argo-gzip", function(){
	it("has a name and install property", function(){
		var server = argo();
		var gzip_package = argo_gzip.package(server);
		assert.ok(gzip_package.name === "gzip compression");
		assert.ok(gzip_package.install);
	});

	it('properly unzips a response body', function(done){
      var env = _getEnv();
      env.request = new Request();
      env.response = new Response();

      var stringToZip = "This is a test string";

      var _http = {};
      _http.IncomingMessage = Request;
      _http.ServerResponse = Response;
      _http.Agent = function() {};
      var app = argo(_http)
      	.use(argo_gzip)
        .use(function(handle) {
          handle('response', function(env, next) {
          	env.response.headers["content-encoding"] = "gzip";
            env.response.getBody(function(err, body) {
                assert.equal(body.toString(), stringToZip);
              	done();              
            });
          });
        });

      zlib.gzip(stringToZip, function(_, result){
        env.response.write(result);
        env.response.end();
        app.call(env);
      });
    });

    it('properly unzips a targeted response body', function(done){
    	  var env = _getEnv();
        env.target.response = new Response();
        env.response = new Response();
        var _http = {};
        _http.IncomingMessage = Request;
        _http.ServerResponse = Response;
        _http.Agent = function() {};
        _http.request = function(options, callback) {
          callback(env.target.response);
          return env.target.response;
        };

        var stringToZip = "This is a test string";

        var app = argo(_http)
          .use(argo_gzip)
          .target("http://test.com")
          .use(function(handle) {
            handle('response', function(env, next) {
              env.target.response.headers["content-encoding"] = "gzip";
              env.target.response.getBody(function(err, body) {
                assert.equal(body.toString(), stringToZip);
                done();
              });
            });
          });

        zlib.gzip(stringToZip, function(_, result){
          env.target.response.write(result);
          env.target.response.end();
          app.call(env);
  	    });

    });

    it('serves uncompressed responses without the header sent', function(done) {
      var env = _getEnv();
      env.request = new Request();
      env.request.url = '/hello';
      env.request.method = 'GET';
      env.response = new Response();

      env.response.end = function(body) {
        assert.equal('application/json; charset=UTF-8', env.response.getHeader('Content-Type'));
        assert.equal('{"hello":"World"}', body);
        done();
      };

      argo()
        .use(argo_gzip)
        .get('/hello', function(handle) {
          handle('request', function(env, next) {
            env.response.statusCode = 200;
            env.response.body = { hello: 'World' };
            next(env);
          });
        })
        .call(env);
    });

    it('serves compressed response strings with the header sent', function(done) {
      var env = _getEnv();
      env.request = new Request();
      env.request.headers = {}
      env.request.headers["accept-encoding"] = "gzip";
      env.request.url = '/hello';
      env.request.method = 'GET';
      env.response = new Response();

      var bodyString = "This is a test";

      env.response.end = function(body) {
        zlib.gzip(bodyString, function(_, result){
          assert.equal('gzip', env.response.getHeader('Content-Encoding'));
          assert.equal(body.toString(), result.toString());
          done();
        });
      };

      argo()
        .use(argo_gzip)
        .get('/hello', function(handle) {
          handle('request', function(env, next) {
            env.response.statusCode = 200;
            env.response.body = bodyString;
            next(env);
          });
        })
        .call(env);
    });

    it('serves compressed response objects with the header sent', function(done) {
      var env = _getEnv();
      env.request = new Request();
      env.request.headers = {}
      env.request.headers["accept-encoding"] = "gzip";
      env.request.url = '/hello';
      env.request.method = 'GET';
      env.response = new Response();

      var bodyString = {"msg":"This is a test"};

      env.response.end = function(body) {
        assert.equal('gzip', env.response.getHeader('Content-Encoding'));
        zlib.gzip(JSON.stringify(bodyString), function(_, result){
          assert.equal('application/json; charset=UTF-8', env.response.getHeader('Content-Type'));
          assert.equal(body.toString(), result.toString());
          done();
        });
      };

      argo()
        .use(argo_gzip)
        .get('/hello', function(handle) {
          handle('request', function(env, next) {
            env.response.statusCode = 200;
            env.response.body = bodyString;
            next(env);
          });
        })
        .call(env);
    });

     it('serves compressed response streams with the header sent', function(done) {
      var env = _getEnv();
      env.request = new Request();
      env.request.headers = {}
      env.request.headers["accept-encoding"] = "gzip";
      env.request.url = '/hello';
      env.request.method = 'GET';
      env.response = new Response();

      var bodyStream = fs.createReadStream("./test/test.txt");

      argo()
        .use(argo_gzip)
        .use(function(handle) {
          handle('response', { affinity: 'sink' }, function(env, next) {
            assert.equal('gzip', env.response.getHeader('Content-Encoding'));

            var gzip = zlib.createGzip();
            var testStream = fs.createReadStream("./test/test.txt");

            var assertStream = new Stream.Writable();
            var buf = [];
            assertStream._write = function(chunk, encoding, callback) {
              buf.push(chunk);
              callback();
            }
            
            var assertStream2 = new Stream.Writable();
            var buf2 = [];
            assertStream2._write = function(chunk, encoding, callback) {
              buf2.push(chunk);
              callback();
            }

            assertStream.on('finish', function() {
              var testStr = buf.join("");

              assertStream2.on('finish', function() {
                var bodyStr = buf2.join("");
                assert.equal(bodyStr.toString(), testStr.toString());
                done();
              });

              env.response.body.pipe(assertStream2);
            });

            testStream.pipe(gzip).pipe(assertStream);
          });
        })
        .get('/hello', function(handle) {
          handle('request', function(env, next) {
            env.response.statusCode = 200;
            env.response.body = bodyStream;
            next(env);
          });
        })
        .call(env);
    });
});
