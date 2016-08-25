const fetch = require('node-fetch');

const CAPI_ENDPOINT = `https://api.ft.com/content`;

module.exports = function(articleUUID){
	
	const CAPI_ITEM_URL = `${CAPI_ENDPOINT}/${articleUUID}?apiKey=${process.env.CAPI_KEY}`;
	
	return fetch(CAPI_ITEM_URL)
		.then(res => {
			if(res.status !== 200){

				if(res.status === 404){
					throw `Could not find content ${articleUUID}`;
				} else {
					throw `An error occurred retrieving ${articleUUID}`;
				}

			} else {
				return res;
			}
		})
		.then(res => res.json())
		.then(res => {
			res.uuid = articleUUID;
			return res;
		})
	;

}