var Artist = module.exports = function() {
  this.id = null;
  this.name = null;
  this.genre = null;
  this.selfUrl = null;
  this.collectionUrl = null;
};

Artist.create = function(fill) {
  fill = fill || {};

  var artist = new Artist();

  artist.id = fill.id;
  artist.name = fill.name;
  artist.genre = fill.genre;
  artist.selfUrl = fill.selfUrl;
  artist.collectionUrl = fill.collectionUrl;

  return artist;
};
