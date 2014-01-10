var http = require('http');
var qs = require('querystring');

var iptables = require('iptables');

var Routing = module.exports = function(container, app, appContainerId) {
  this.container = container;
  this.app = app;
  this.appContainerId = appContainerId;

  this.routerAddress = process.env.ROUTER_IP_ADDR;
  this.routerPort = process.env.ROUTER_PORT;
  this.hostname = process.env.HOSTNAME;

  this.appAddress = null;
  this.appPort = null;

  this.steps = ['inspect', 'setRoute', 'allowAccess'];
};

Routing.prototype.inspect = function(cb) {
  var self = this;
  this.container.inspect(this.appContainerId, function(err, body) {
    if (err) return cb(err);

    var info = JSON.parse(body);
    self.appAddress = info.NetworkSettings.IPAddress;
    self.appPort = Object.keys(info.NetworkSettings.Ports)[0].split('/')[0];

    cb();
  });
};

Routing.prototype.setRoute = function(cb) {
  var options = {
    method: 'POST',
    host: this.routerAddress,
    port: this.routerPort,
    path: '/apps'
  };

  var req = http.request(options, function(res) {
    if (res.statusCode !== 201) {
      return cb(new Error('Routing failed - ' + res.statusCode));
    }

    cb();
  });

  req.on('error', cb);

  var data = qs.stringify({
    host: this.app + '.' + this.hostname,
    target: 'http://' + this.appAddress + ':' + this.appPort
  });

  req.write(data);
  req.end();
};

Routing.prototype.allowAccess = function(cb) {
  var dockerInterface = 'docker0';

  iptables.allow({
    chain: 'FORWARD',
    src: this.routerAddress,
    dst: this.appAddress,
    in: dockerInterface,
    out: dockerInterface,
    protocol: 'tcp',
    dport: this.appPort,
  });

  iptables.allow({
    chain: 'FORWARD',
    src: this.appAddress,
    dst: this.routerAddress,
    in: dockerInterface,
    out: dockerInterface,
    protocol: 'tcp',
    sport: this.appPort,
  });

  var containerLockdownConfig = {
    chain: 'FORWARD',
    in: dockerInterface,
    out: dockerInterface,
    target: 'DROP'
  };

  //console.log('deleting rule preventing cross-container communication')
  //iptables.deleteRule(containerLockdownConfig);
  //console.log('adding rule preventing cross-container communication')
  //iptables.newRule(containerLockdownConfig);

  cb();
};
