const fetch = require('node-fetch');

const CAPI_ENDPOINT = `https://api.ft.com/content`;

module.exports = function(articleUUID){
	
	const CAPI_ITEM_URL = `${CAPI_ENDPOINT}/${articleUUID}?apiKey=${process.env.CAPI_KEY}`;
	
	return fetch(CAPI_ITEM_URL)
		.then(res => res.json())
		.then(res => {
			res.uuid = articleUUID;
			return res;
		})
	;

}