const debug = require('debug')('bin:lib:content');
const fetch = require('node-fetch');
const lru = require('lru-cache');

const CAPI_ENDPOINT = process.env.CAPI_ENDPOINT;
const oneDay = 1000 * 60 * 60 * 24;

const cache = lru({
	max : 100,
	maxAge : oneDay
});

module.exports = function(articleUUID){
	
	const CAPI_ITEM_URL = `${CAPI_ENDPOINT}/${articleUUID}?apiKey=${process.env.CAPI_KEY}`;

	const cachedArticle = cache.get(articleUUID);

	if(cachedArticle !== undefined){
		debug(`Delivering ${articleUUID} from cache`);
		return Promise.resolve( cachedArticle );
	}

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
			cache.set(articleUUID, res);
			return res;
		})
	;

}