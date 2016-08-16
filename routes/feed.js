const express = require('express');
const router = express.Router();
const isUUID = require('is-uuid');
const debug = require('debug')('routes:partner');
const MongoClient = require('mongodb').MongoClient;

const mongoURL = process.env.MONGO_ENDPOINT;

const validCredentials = require('../bin/lib/checkcreds');
const getContent = require('../bin/lib/content');
const rssify = require('../bin/lib/rssify');

const extractUUID = require('../bin/lib/extract-uuid');

router.use( validCredentials );

router.get('/', function(req, res, next) {
	res.redirect('/feed/all');
});


router.get('/all', function(req, res, next){

	MongoClient.connect(mongoURL, function(err, db) {

		if(err){
			console.log(err);
		}

		var collection = db.collection('articles');

		collection.find({}).toArray(function(err, entries){
			
			const articles = entries.map(entry => {
				return getContent(entry.uuid);
			});

			Promise.all(articles)
				.then(articles => rssify(articles))
				.then(XML => {
					res.send(XML);
				})
				.catch(err => {
					console.log('Error', err);
					res.status(500);
					res.send("An error occurred");
				})
			;

		})

	});


});

router.get('/item/:uuid', function(req, res, next) {

	extractUUID(req.params.uuid)
		.then(articleUUID => {

			MongoClient.connect(mongoURL, function(err, db){

				if(err){
					console.log(err);
					res.status(500);
					res.send("Error connecting to database");
					return;
				}

				const collection = db.collection('articles');

				collection.findOne({
					uuid : articleUUID
				}, {}, function(err, item){
					console.log("ITEM:", item);

					if(err){
						console.log(err);
						res.status(500);
						res.end();
						return;
					}

					if(item === null){
						res.status(401);
						res.send("UUID not found");
					} else {

						getContent(articleUUID)
							.then(content => {
								res.send(content.bodyXML);
							})
							.catch(err => {
								console.log(err);
							})
						;
					
					}

				});
			


			});
			
		})
		.catch(err => {
			res.status(404);
			res.send("That is not a valid UUID");
		})

	;

});

module.exports = router;
