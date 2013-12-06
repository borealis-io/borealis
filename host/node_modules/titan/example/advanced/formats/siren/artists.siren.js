module.exports = function(model) {
  var entity = {
    class: ['artists'],
    entities: [],
    links: [
      { rel: ['self'], href: model.selfUrl }
    ]
  };

  entity.entities = model.items.map(function(item) {
    var artist = {
      class: ['item', 'artist'],
      properties: {
        name: item.name,
        genre: item.genre
      },
      links: [
        { rel: ['self'], href: item.selfUrl }
      ]
    };

    return artist;
  });

  return entity;
};
