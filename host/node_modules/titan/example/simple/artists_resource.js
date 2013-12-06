var Artists = module.exports = function() {
  this.artists = [
    { id: 'nirvana', name: 'Nirvana', genre: 'Grunge' },
    { id: 'the-beatles', name: 'The Beatles', genre: 'Pop' },
    { id: 'elvis', name: 'Elvis Presley', genre: 'Rock' }
  ];
};

Artists.prototype.init = function(config) {
  config
    .path('/artists')
    .get('/', this.list)
    .get('/{id}', this.show);
};

Artists.prototype.list = function(env, next) {
  env.response.body = this.artists;
  next(env);
};

Artists.prototype.show = function(env, next) {
  var id = env.route.params.id;

  var filtered = this.artists.filter(function(artist) {
    return artist.id === id;
  });

  if (filtered.length) {
    env.response.body = filtered[0];
  } else {
    env.response.statusCode = 404;
  }

  next(env);
};
