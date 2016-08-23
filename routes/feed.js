const express = require('express');
const router = express.Router();
const debug = require('debug')('routes:partner');

const getContent = require('../bin/lib/content');
const rssify = require('../bin/lib/rssify');
const database = require('../bin/lib/database');

// router.use( validCredentials );

router.get('/', function(req, res, next) {
	res.redirect('/feed/all');
});

router.get('/all', function(req, res, next){

	const noTags = req.query.notags === "true";

	database.scan(process.env.AWS_DATA_TABLE)
		.then(data => {

			const articles = data.Items.map(entry => {
				return getContent(entry.uuid);
			});

			Promise.all(articles)
				.then(articles => rssify(articles, noTags))
				.then(XML => {
					res.send(XML);
				})
				.catch(err => {
					debug('Error', err);
					res.status(500);
					res.send("An error occurred");
				})
			;

		});
	;

});

module.exports = router;
