var titan = require('../../');
var ArtistsResource = require('./artists_resource');

titan()
  .allow('*')
  .compress()
  .logger()
  .add(ArtistsResource)
  .listen(3000);
