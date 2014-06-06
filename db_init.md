DB init:
db.createCollection(properties);
db.properties.ensureIndex( { Address: 1 }, { unique: true, dropDups: true } );