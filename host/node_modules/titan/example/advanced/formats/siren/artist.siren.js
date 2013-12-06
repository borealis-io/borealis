module.exports = function(model) {
  var entity = {
    class: ['artist'],
    properties: {
      name: model.name,
      genre: model.genre
    },
    links: [
      { rel: ['collection'], href: model.collectionUrl },
      { rel: ['self'], href: model.selfUrl }
    ]
  };

  return entity;
};
