const RSS = require('rss');
const reformat = require('./reformat');

module.exports = function(items, shouldStripTags){

	if(!Array.isArray(items)){
		items = [items];
	}

	const feed = new RSS({
		title : "FT for Spoken Layer",
		description : "An RSS feed with FT content for consumption by Spoken Layer",
		feed_url : `${process.env.SERVER_ROOT}/feed/all`,
		site_url : `${process.env.SERVER_ROOT}/`
	});

	items.forEach(item => {

		feed.item({
			title : item.title,
			description : shouldStripTags === true ? reformat (item.bodyXML) : item.bodyXML,
			url : `https://www.ft.com/content/${item.uuid}`,
			author : item.byline,
			date : item.publishedDate
		});

	});

	return Promise.resolve(feed.xml());

}