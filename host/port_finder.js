var MINPORT = 59153;
var MAXPORT = 65535;

var current = MINPORT;

module.exports = function() {
  return current++;
};
