var Locations = require('./locations');
var Products = require('./products');

module.exports = function(config) {
  config.attach('/store/products', Products,
      { consumes: ['application/json'], produces: ['application/json'] });

  config.attach('/store/locations', Locations, { produces: ['application/json'] });
};
