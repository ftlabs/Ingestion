const express = require('express');
const router = express.Router();
const isUUID = require('is-uuid');
const debug = require('debug')('routes:partner');
const MongoClient = require('mongodb').MongoClient;

const validCredentials = require('../bin/lib/checkcreds');
const getContent = require('../bin/lib/content');
const rssify = require('../bin/lib/rssify');

router.get('/', function(req, res, next) {
  res.render('content', { title: 'FT Content' });
});

router.get('/all', function(req, res, next){

	if(validCredentials(req, res)){

		const mongoURL = process.env.MONGO_ENDPOINT;

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
					})
				;

			})

		});

	}

});

router.get('/item/:uuid', function(req, res, next) {

	if(validCredentials(req, res)){

		const articleUUID = req.params.uuid;

		if(!articleUUID || !isUUID.anyNonNil(articleUUID)){
			res.send("Not a valid UUID");
			return
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

	}

});

module.exports = router;
