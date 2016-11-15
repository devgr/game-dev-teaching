var express = require('express');
var dataAccess = require('../data_access/games');
var router = express.Router();

// Get all of the game configurations
router.get('/', function(req, res, next) {
	dataAccess.getlist(function(docs){
		res.json(docs);
	});
});

// Create a new game configuration
router.post('/', function(req, res){
	dataAccess.create(req.body, function(result){
		res.send('got it');
	});
});

module.exports = router;
