var titan = require('titan');

var port = process.env.PORT || 3000;
var host = process.env.HOST;

titan()
  .logger()
  .load()
  .listen(port, host);
