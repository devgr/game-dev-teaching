var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connection URL
var dbUrl = 'mongodb://localhost:27017/gdt';

// test connection
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


var insert = function(db, data, callback) {
	// TODO: Reorganize to make database connecting a seperate function that returns a promise

	MongoClient.connect(dbUrl, function(err, db) {
		assert.equal(null, err);
		console.log("Connected successfully to server");

		db.authenticate('testuser', 'testing123cananybodyhearme').then(function(result){
			assert.equal(true, result);
			
			// Get the example collection
			var collection = db.collection('games');
			// Insert some documents
			collection.insertOne(data, function(err, result) {
				assert.equal(err, null);
				assert.equal(1, result.result.n);
				console.log("Inserted 3 documents into the collection");
				callback(result);
			});

			db.close();
		});
	});
};


//MongoClient.connect(dbUrl, function(err, db) {
//	assert.equal(null, err);
//
//	insert(db, function(){
//		db.close();
//	});
//});
