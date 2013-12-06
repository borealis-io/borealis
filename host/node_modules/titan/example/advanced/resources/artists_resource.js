var Artist = require('../models/artist');
var ArtistList = require('../models/artist_list');

var ArtistsResource = module.exports = function() {
  this.path = '/artists';
  this.artists = [
    { id: 'nirvana', name: 'Nirvana', genre: 'Grunge' },
    { id: 'the-beatles', name: 'The Beatles', genre: 'Pop' },
    { id: 'elvis', name: 'Elvis Presley', genre: 'Rock' }
  ];
};

ArtistsResource.prototype.init = function(config) {
  config
    .path(this.path)
    .produces('application/json')
    .produces('application/vnd.siren+json')
    .get('/', this.list)
    .get('/{id}', this.show);
};

ArtistsResource.prototype.list = function(env, next) {
  var urlHelper = env.helpers.url;

  var items = this.artists.map(function(item) {
    var artist = Artist.create({
      id: item.id,
      name: item.name,
      genre: item.genre,
      selfUrl: urlHelper.join(item.id)
    });

    return artist;
  });

  var list = ArtistList.create({
    items: items,
    selfUrl: urlHelper.current()
  });

  env.format.render('artists', list);
  next(env);
};

ArtistsResource.prototype.show = function(env, next) {
  var id = env.route.params.id;
  var urlHelper = env.helpers.url;

  var filtered = this.artists.filter(function(artist) {
    return artist.id === id;
  });

  if (filtered.length) {
    var found = filtered[0];

    var artist = Artist.create({
      id: found.id,
      name: found.name,
      genre: found.genre,
      selfUrl: urlHelper.current(),
      collectionUrl: urlHelper.path(this.path)
    });

    env.format.render('artist', artist);
  } else {
    env.response.statusCode = 404;
  }

  next(env);
};
