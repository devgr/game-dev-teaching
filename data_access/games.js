// Data access for games collection
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var dbUrl = 'mongodb://localhost:27017/gdt';

MongoClient.connect(dbUrl, function(err, db) {
	assert.equal(null, err);
	console.log("Connected successfully to server");

	db.authenticate('testuser', 'testing123cananybodyhearme').then(function(result){
		assert.equal(true, result);
		console.log("Authenticated successfully to server");
		db.close();
	}, function(err){
		// try to create user
		db.addUser('testuser', 'testing123cananybodyhearme', {
			roles: [
				'readWrite'
			]
		}).then(function(result) {
			// Authenticate
			db.authenticate('testuser', 'testing123cananybodyhearme').then(function(result) {
				assert.equal(true, result);
				console.log("Authenticated successfully to server");
				db.close();
			});
		});
	});
});


var GamesDataAccess = {
	getlist: function(callback){
		MongoClient.connect(dbUrl, function(err, db) {
			assert.equal(null, err);
			db.authenticate('testuser', 'testing123cananybodyhearme').then(function(result){
				assert.equal(true, result);
				var collection = db.collection('games');

				collection.find().toArray(function(err, docs) {
					assert.equal(null, err);
					console.log('Retrieved ' + docs.length.toString() + ' docs from games collection');
					callback(docs);
				});

				db.close();
			});
		});
	},
	create: function(data, callback) {
		// TODO: Reorganize to make database connecting a seperate function that returns a promise
		MongoClient.connect(dbUrl, function(err, db) {
			assert.equal(null, err);
			db.authenticate('testuser', 'testing123cananybodyhearme').then(function(result){
				assert.equal(true, result);
				var collection = db.collection('games');

				collection.insertOne(data, function(err, result) {
					assert.equal(err, null);
					assert.equal(1, result.result.n);
					console.log("Inserted document into the games collection");
					callback(result);
				});

				db.close();
			});
		});
	}
};

module.exports = GamesDataAccess;