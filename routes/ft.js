const express = require('express');
const router = express.Router();
const S3O = require('s3o-middleware');

const debug = require('debug')('routes:ft');

const errorReporting = require('../bin/lib/error-reporting');
const audit = require('../bin/lib/audit');
const extractUUID = require('../bin/lib/extract-uuid');
const checkUUID = require('../bin/lib/check-uuid');
const checkBucket = require('../bin/lib/check-bucket');
const getContent = require('../bin/lib/content');
const database = require('../bin/lib/database');
const databaseError = require('../bin/lib/database-error');
const generateS3PublicURL = require('../bin/lib/get-s3-public-url');
const getTopicArticles = require('../bin/lib/search-topic');

router.use(S3O);

router.get('/', function(req, res){

	database.scan(process.env.AWS_DATA_TABLE, { available : { ComparisonOperator : "NULL" } } )
		.then(data => {

			data.Items.sort((a, b) => {
				if(a.madeAvailable < b.madeAvailable){
					return 1;
				} else if(a.madeAvailable > b.madeAvailable) {
					return -1;
				} else {
					return 0;
				}
			})

			const isRecorded = data.Items.map(item => {

				return checkBucket(item.uuid);

			});

			Promise.all(isRecorded)
				.then(vals => {
					// do a SAPI search for all artuicles tagged with the audio-articles topic
					return getTopicArticles()
						.then(searchResult => {
							return{
								vals : vals,
								searchResult : searchResult
							};
						})
					;
				})
				.then(valsAndSearch => {
					// loop through search results to find all article UUIDs
					let searchResult = valsAndSearch['searchResult'];
					let taggedUUIDs  = {};

					if (searchResult 
						&& searchResult['results']
						&& searchResult['results'][0]
						&& searchResult['results'][0]['results'] 
						) {
						searchResult['results'][0]['results'].forEach(function(r){
							let id = r['id'];
							taggedUUIDs[id] = true;
						});
					};
					
					return {
						vals: valsAndSearch['vals'],
						taggedUUIDs: taggedUUIDs
					};
				})
				.then(valsAndTaggedUUIDs => {
					// flesh out each article item
					let vals        = valsAndTaggedUUIDs['vals'];
					let taggedUUIDs = valsAndTaggedUUIDs['taggedUUIDs'];

					vals.forEach( (val, idx) => {
						let item             = data.Items[idx];
						let returnedUnixTime = item['madeAvailable'] + item['turnaround'];
						
						item.recorded = (val === true)? returnedUnixTime : "No";
						item.tagged   = (item.uuid in taggedUUIDs)? 'Y' : 'N';

						debug(`isRecorded+tagged: tagged=${item['tagged']}, recorded=${item['recorded']}`);
						if(val === true){
							data.Items[idx].publicURL = generateS3PublicURL(item.uuid);							
						};
					});

					res.render('list-exposed-articles', {
						title : 'Accessible Articles',
						visibleDocs : Array.from(data.Items)
					});

				})
				.catch(err => {
					debug(err);
				})
			;


		})
		.catch(err => {
			debug(err);
			errorReporting(err);
			databaseError(res, 'Error getting articles', err);
		});
	;

});

router.get('/add', function(req, res) {
	res.render('expose-article', { title: 'Expose an article' });
});

router.post('/add', (req, res) => {

	let articleUUID = undefined;

	checkUUID(req.body.uuid)
		.then(UUID => {
			articleUUID = UUID;
			return getContent(UUID);
		})
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
			res.redirect('/ft/add?success=true');
			audit({
				user : req.cookies.s3o_username,
				action : 'addArticle',
				article : articleUUID
			});
		})
		.catch(err => {
			debug(err);
			errorReporting(err);
			res.redirect('/ft/add?success=false');			
		})
	;

});

router.get('/delete/:uuid', function(req, res){

	let articleUUID = null;
	
	extractUUID(req.params.uuid)
		.then(UUID => {
			articleUUID = UUID;
			debug(UUID);
			database.read({uuid : UUID}, process.env.AWS_DATA_TABLE)
				.then(result => {
					const itemToRemove = result.Item;
					itemToRemove.available = false;
					return database.write(itemToRemove, process.env.AWS_DATA_TABLE);
				})
			;
		})
		.then(result => {
			debug(`${articleUUID} is no longer accessible to 3rd parties`, result);
			res.redirect('/ft?deleted=true');
			audit({
				user : req.cookies.s3o_username,
				action : 'deleteArticle',
				article : articleUUID
			});
		})
		.catch(err => {
			debug(`An error occurred making ${articleUUID} no longer accessible to 3rd parties`, err);
			errorReporting(err);
			res.redirect(`/ft?deleted=false`);
		})
	;

});

router.get('/logs', function(req, res){

	database.scan(process.env.AWS_AUDIT_TABLE, {})
		.then(results => {

			debug(results);
			const items = results.Items.sort((a, b) => {
				if(a.time < b.time){
					return 1;
				} else if(a.time > b.time) {
					return -1;
				} else {
					return 0;
				}
			});

			res.render('logs', {
				title : "Logs",
				logs : items
			});

		})
		.catch(err => {
			debug(`An error occurred trying to retrieve the logs`, err);			
			errorReporting(err);
			databaseError(res, 'Error getting logs', err);
		});
	;

});

module.exports = router;
