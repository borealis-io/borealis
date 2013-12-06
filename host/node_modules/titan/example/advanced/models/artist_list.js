var ArtistList = module.exports = function() {
  this.items = null;
  this.selfUrl = null;
};

ArtistList.create = function(fill) {
  fill = fill || {};

  var list = new ArtistList();

  list.items = fill.items;
  list.selfUrl = fill.selfUrl;

  return list;
};
