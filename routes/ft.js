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

});

router.get('/delete/:uuid', function(req, res, next){

	let uuid = null;

	extractUUID(req.params.uuid)
		.then(UUID => {
			uuid = UUID;
			console.log(UUID);
			return database.remove({uuid : UUID}, process.env.AWS_DATA_TABLE)
		})
		.then(result => {
			debug(`${uuid} is no longer accessible to 3rd parties`);
			res.redirect(`/ft?deleted=true`);

		})
		.catch(err => {
			debug(`An error occurred making ${uuid} no longer accessible to 3rd parties`, err);
			res.redirect(`/ft?deleted=false`);
		})
	;

});

module.exports = router;
