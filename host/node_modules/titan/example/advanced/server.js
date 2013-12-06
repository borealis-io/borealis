var path = require('path');
var siren = require('argo-formatter-siren');
var titan = require('../../');

titan()
  .allow('*')
  .compress()
  .logger()
  .format({ engines: [siren], override: { 'application/json': siren } })
  .load(path.join(__dirname, 'resources'))
  .listen(3000);
