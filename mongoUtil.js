var MongoClient = require('mongodb').MongoClient;
var format = require('util').format;
var utils = require('./utils');

var MongoDB = function(host, port, database, collection) {
	this.host = host;
	this.port = port;
	this.database = database;
	this.collection = collection;
};

module.exports = MongoDB;

MongoDB.prototype.init = function(cb) {
	MongoClient.connect(format("mongodb://%s:%s/%s", this.host, this.port, this.database), function(err, db) {
		if(!!err) {
			utils.invokeCallback(cb, err);
			return;
		}
		cb(err, db);
	});
};

MongoDB.prototype.insert = function(msg, cb) {
	var self = this;
	this.init(function(err, db) {
		db.collection(self.collection).insert(msg, function(err, objects) {
      if (!!err) {
      	throw new Error('mongodb insert message error: %j', msg);
				return;
      }
      utils.invokeCallback(cb, err, objects);
      db.close();
    });
	});
};

MongoDB.prototype.findToArray = function(limit, cb) {
	var self = this;
	this.init(function(err, db) {
		db.collection(self.collection).find({}, {'limit': limit, 'sort': [['timestamp', -1]]}).toArray(function(err, objects) {
      if (!!err) {
      	throw new Error('mongodb find message error: %j', err);
				return;
      }
      utils.invokeCallback(cb, err, objects);
      db.close();
    });
	});
};