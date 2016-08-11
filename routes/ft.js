const express = require('express');
const router = express.Router();
const S3O = require('s3o-middleware');
const MongoClient = require('mongodb').MongoClient;

const extractUUID = require('../bin/lib/check-uuid');

const mongoURL = process.env.MONGO_ENDPOINT;

router.use(S3O);
router.get('/', function(req, res, next){

	MongoClient.connect(mongoURL, function(err, db){

		if(err){
			res.status(500);
			res.send("Error connecting to database");
			return;
		}

		const articles = db.collection('articles');

		articles.find({}).toArray(function(err, docs){

			if(err){
				console.log(err);
				res.status(500);
				res.end();
				return;
			}

			console.log(docs);
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

	const articleUUID = extractUUID(req.body.uuid);

	console.log("UUID:", articleUUID);

	if(!articleUUID){
		res.redirect("/ft/add?success=false");
	} else {

		MongoClient.connect(mongoURL, function(err, db) {

			if(err){
				console.log(err);
				res.status(500);
				res.send("Error connecting to database");
				return;
			}
			const collection = db.collection('articles');

			collection.updateOne({uuid : articleUUID}, {uuid : articleUUID}, {upsert : true}, function(err, result){
				if(err){
					console.log(err);
					res.status(500);
					res.end();
				} else {
					console.log(articleUUID, 'has been exposed to 3rd parties');
					res.redirect("/ft/add?success=true");
				}
			});

			db.close();

		});

	}

});

router.get('/delete/:uuid', function(req, res, next){

	const articleUUID = extractUUID(req.params.uuid);

	if(!articleUUID){
		res.redirect(`/ft?deleted=false&uuid=${articleUUID}`);
	} else {

		MongoClient.connect(mongoURL, function(err, db){

			if(err){
				console.log(err);
				res.status(500);
				res.send("Error connecting to database");
				return;
			}

			const collection = db.collection('articles');
			collection.deleteOne({
				uuid : articleUUID
			}, function(err, result){

				if(err){
					console.log(err);
					res.status(500);
					res.send("An error occurred deleting that article from the database");
				} else {
					console.log(`Article ${articleUUID} is no longer visible to 3rd parties`);
					res.redirect(`/ft?deleted=true&uuid=${articleUUID}`);
				}

			})

			db.close();
			
		});

	}


});

module.exports = router;
