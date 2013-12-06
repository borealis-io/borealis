var argo = require('argo');
var resource = require('../');
var router = require('argo-url-router');

var authentication = require('./authentication');
var authorization = require('./authorization');
var basic = require('./basic');

var Products = require('./products');
var Locations = require('./locations');

argo()
  .use(router)
  .use(basic)
  .use(authentication)
  .use(authorization)
  .map('/store', function(server) {
    server
      .use(resource(Products))
      .use(resource(Locations));
  })
  .listen(3000);
