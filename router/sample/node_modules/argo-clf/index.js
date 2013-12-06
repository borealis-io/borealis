var Stream = require('stream');
var moment = require('moment');

module.exports = function(handle) {
  handle('response', { affinity: 'sink' }, function(env, next) {
    if (env.request) {
      var req = env.request;
      var res = env.response || env.target.response;
      var UNKNOWN = '-';
      var ip = req.connection.remoteAddress;
      var date = '[' + moment(Date.now()).format('D/MMM/YYYY:HH:mm:ss ZZ') + ']';
      var method = req.method;
      var url = req.url;
      var requestSummary = '"' + method + ' ' + url + '"';
      var status = res.statusCode;
      var length = 0;
      
      if( env.response.body !== null && env.response.body !== undefined) {
        var body = res.body;
        if(typeof body === 'string') {
          var buf = new Buffer(body);
          length = buf.length;
        } else if (body instanceof Stream) {
          length = UNKNOWN;
        } else if (body instanceof Buffer) {
          length = body.length;
        } else if (typeof body === 'object') {
          var bodyString = JSON.stringify(body);
          var buf = new Buffer(bodyString);
          length = buf.length;
        }
        var log = [ ip, UNKNOWN, UNKNOWN, date, requestSummary, status, length ];
        console.log(log.join('\t'));
        next(env);
      } else {
        var contentLength = env.response.getHeader('Content-Length');
        if (contentLength == '0') {
          length = 0;
          var log = [ ip, UNKNOWN, UNKNOWN, date, requestSummary, status, length ];
          console.log(log.join('\t'));
          next(env);
        } else if (env.target.response !== null && env.target.response !== undefined) {
          env.target.response.getBody(function(err, body) {
            if(body) {
              length = body.length;
              var log = [ ip, UNKNOWN, UNKNOWN, date, requestSummary, status, length ];
              console.log(log.join('\t'));
              next(env);
            }
          });
        } else {
          length = 0;
          var log = [ ip, UNKNOWN, UNKNOWN, date, requestSummary, status, length ];
          console.log(log.join('\t'));
          next(env);
        }
      }
    }
  });
};

