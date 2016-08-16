const RSS = require('rss');
const reformat = require('./reformat');

module.exports = function(items){

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
			description : `${item.bodyXML.substring(0, 100)}...`,
			url : `${process.env.SERVER_ROOT}/feed/item/${item.uuid}`,
			author : item.byline,
			date : item.publishedDate,
			custom_elements : [
				{content : item.bodyXML }
			]
		});

	});

	return Promise.resolve(feed.xml());

}