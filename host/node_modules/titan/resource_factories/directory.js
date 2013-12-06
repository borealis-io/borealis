var fs = require('fs');
var path = require('path');
var resource = require('argo-resource');

var DirectoryResourceFactory = module.exports = function(options) {
  options = options || {};
  this.directory = options.directory
    || path.join(path.dirname(require.main.filename), '/resources');
};

DirectoryResourceFactory.prototype.resolve = function() {
  var dir = this.directory;

  if (!this.manual) {
    var files = fs.readdirSync(dir);
    var self = this;

    return files.filter(function(file) {
      return file[0] !== '.';
    }).map(function(file) {
      var res = require(path.join(dir, file));
      return resource(res);
    });
  }
};
