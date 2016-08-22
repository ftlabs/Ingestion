const express = require('express');
const router = express.Router();
const S3O = require('s3o-middleware');
const MongoClient = require('mongodb').MongoClient;
const debug = require('debug')('routes:ft');

const extractUUID = require('../bin/lib/extract-uuid');
const checkUUID = require('../bin/lib/check-uuid');
const databaseError = require('../bin/lib/database-error');

const mongoURL = process.env.MONGO_ENDPOINT;

router.use(S3O);

router.get('/', function(req, res, next){

	MongoClient.connect(mongoURL, function(err, db){

		if(err){
			databaseError(res, "Error connecting to the database", err);
			return;
		}

		const articles = db.collection('articles');

		articles.find({}).toArray(function(err, docs){

			if(err){
				debug(err);
				res.status(500);
				res.end();
				return;
			}

			debug(docs);

			docs.sort(function(a, b){
				if(a.madeAvailable < b.madeAvailable){
					return 1;
				} else if(a.madeAvailable > b.madeAvailable) {
					return -1;
				} else {
					return 0;
				}
			});

			res.render('list-exposed-articles', {
				title : "Accessible Articles",
				visibleDocs : Array.from(docs)
			});

		});

	});

});

router.get('/add', function(req, res, next) {
	res.render('expose-article', { title: 'Expose an article' });
});

router.post('/add', (req, res, next) => {

	const articleUUID = checkUUID(req.body.uuid)
		.then(function(content){

			debug("UUID:", content.uuid);
			MongoClient.connect(mongoURL, function(err, db) {

				if(err){
					databaseError(res, "Error connecting to the database", err);
					return;
				}
				const collection = db.collection('articles');

				collection.updateOne(
					{uuid : content.uuid},
					{
						uuid : content.uuid, 
						headline: content.title,
						publishedDate: content.publishedDate,
						madeAvailable: Date.now() / 1000 | 0 // | 0 is like Math.floor()
					}, 
					{upsert : true},
					function(err, result){
						if(err){
							debug(err);
							res.status(500);
							res.end();
						} else {
							debug(content.uuid, 'has been exposed to 3rd parties');
							res.redirect("/ft/add?success=true");
						}
				});

				db.close();

			});

		})
		.catch(err => {
			res.redirect("/ft/add?success=false");			
		})
	;


});

router.get('/delete/:uuid', function(req, res, next){

	const articleUUID = extractUUID(req.params.uuid)
		.then(UUID => {
			
			MongoClient.connect(mongoURL, function(err, db){

				if(err){
					databaseError(res, "Error connecting to the database", err);
					return;
				}

				const collection = db.collection('articles');
				collection.deleteOne({
					uuid : UUID
				}, function(err, result){

					if(err){
						debug(err);
						res.status(500);
						res.send("An error occurred deleting that article from the database");
					} else {
						debug(`Article ${UUID} is no longer visible to 3rd parties`);
						res.redirect(`/ft?deleted=true&uuid=${UUID}`);
					}

				})

				db.close();
				
			});

		})
		.catch(err => {
			res.redirect(`/ft?deleted=false&uuid=${UUID}`);
		})
	;


});

module.exports = router;
