const express = require('express');
const router = express.Router();
const S3O = require('s3o-middleware');
const MongoClient = require('mongodb').MongoClient;
const debug = require('debug')('routes:ft');

const extractUUID = require('../bin/lib/extract-uuid');
const checkUUID = require('../bin/lib/check-uuid');
const getContent = require('../bin/lib/content');
const database = require('../bin/lib/database');
const databaseError = require('../bin/lib/database-error');

const mongoURL = process.env.MONGO_ENDPOINT;

router.use(S3O);

router.get('/', function(req, res, next){

	database.scan(process.env.AWS_DATA_TABLE)
		.then(data => {
			debug(data);

			data.Items.sort((a, b) => {
				if(a.madeAvailable < b.madeAvailable){
					return 1;
				} else if(a.madeAvailable > b.madeAvailable) {
					return -1;
				} else {
					return 0;
				}
			})

			res.render('list-exposed-articles', {
				title : "Accessible Articles",
				visibleDocs : Array.from(data.Items)
			});

		})
		.catch(err => {
			debug(err);
			databaseError(res, "Error getting articles", err);
		});
	;

});

router.get('/add', function(req, res, next) {
	res.render('expose-article', { title: 'Expose an article' });
});

router.post('/add', (req, res, next) => {

	checkUUID(req.body.uuid)
		.then(UUID => getContent(UUID))
		.then(content => {
			return database.write({
					uuid : content.uuid, 
					headline: content.title,
					publishedDate: content.publishedDate,
					madeAvailable: Date.now() / 1000 | 0 // | 0 is like Math.floor()
				}, process.env.AWS_DATA_TABLE)
			;
		}).then(results => {
			debug(results);
			res.redirect("/ft/add?success=true");
		})
		.catch(err => {
			debug(err);
			res.redirect("/ft/add?success=false");			
		})
	;

	/*const articleUUID = checkUUID(req.body.uuid)
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
	;*/


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
