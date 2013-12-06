var titan = require('titan');

titan()
  .logger()
  .load()
  .listen(process.env.PORT || 3000);
