const express = require('express');
const router = express.Router();
const debug = require('debug')('routes:partner');

const errorReporting = require('../bin/lib/error-reporting');
const audit = require('../bin/lib/audit');
const getContent = require('../bin/lib/content');
const rssify = require('../bin/lib/rssify');
const database = require('../bin/lib/database');

// router.use( validCredentials );

router.get('/', function(req, res) {
	res.redirect('/feed/all');
});

router.get('/all', function(req, res){

	const noTags = req.query.notags === "true";

	database.scan(process.env.AWS_DATA_TABLE, { available : { ComparisonOperator : "NULL" } })
		.then(data => {

			const articles = data.Items.map(entry => {
				return getContent(entry.uuid);
			});

			Promise.all(articles)
				.then(articles => rssify(articles, noTags))
				.then(XML => {
					res.send(XML);
					audit({
						user : req.cookies.s3o_username || "UNKNOWN",
						action : 'accessFeed'
					});
				})
				.catch(err => {
					debug('Error', err);
					errorReporting(err);
					res.status(500);
					res.send("An error occurred");
				})
			;

		});
	;

});

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const extractUUID = require('../bin/lib/extract-uuid');

const firstFTURL = "https://www.ft.com/firstft";

router.get('/firstft', function(req, res){
	// res.end();
	
	const noTags = req.query.notags === "true";

	fetch(firstFTURL)
		.then(res => res.text())
		.then(function(HTML){

			const parsedHTML = cheerio.load(HTML, {
				normalizeWhitespace: true,
				xmlMode: true
			});

			const firstFTPageUUID = Array.from(parsedHTML('#stream .stream-item .card__title-link'))[0].attribs.href.replace('/content/', '');

			return firstFTPageUUID;

		})
		.then(UUID => getContent(UUID))
		.then(firstFTPageContent => {
			console.log(firstFTPageContent);

			const parsedContent = cheerio.load(firstFTPageContent.bodyXML, {
				normalizeWhitespace: true,
				xmlMode: true
			});

			const UUIDs = Array.from(parsedContent('ft-content')).map(link => extractUUID(link.attribs.url));

			return Promise.all(UUIDs)
				.then(contentUUIDs => {
					const articles = contentUUIDs.map(uuid => {
						return getContent(uuid);
					});
					return Promise.all(articles);
				})
			;

		})
		.then(articles => rssify(articles, noTags))
		.then(XML => {
			res.send(XML);			
		})
		.catch(err => {
			console.log(err);
		})
	;

});

module.exports = router;
