const express = require('express');
const router = express.Router();
const isUUID = require('is-uuid');
const debug = require('debug')('routes:partner');

const validCredentials = require('../bin/lib/checkcreds');
const getContent = require('../bin/lib/content');
const rssify = require('../bin/lib/rssify');

router.get('/', function(req, res, next) {
  res.render('content', { title: 'FT Content' });
});

router.get('/all', function(req, res, next){

	if(validCredentials(req, res)){

		const articles = [
			getContent('48235c16-5e1d-11e6-bb77-a121aa8abd95'),
			getContent('e5e64860-5df9-11e6-bb77-a121aa8abd95'),
			getContent('3a2307f0-5d3d-11e6-a72a-bd4bf1198c63'),
			getContent('f5e79520-5d59-11e6-a72a-bd4bf1198c63'),
			getContent('b28e83a6-5d86-11e6-a72a-bd4bf1198c63')
		];

		Promise.all(articles)
			.then(articles => rssify(articles))
			.then(XML => {
				res.send(XML);
			})
			.catch(err => {
				console.log('Error', err);
			})
		;
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
