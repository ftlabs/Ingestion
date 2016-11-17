const debug = require('debug')('bin:lib:search-topic');
const fetch = require('node-fetch');
const lru = require('lru-cache');

const CAPI_ENDPOINT = process.env.CAPI_ENDPOINT;
const oneDay = 1000 * 60 * 60 * 24; 
const tenMins = 10 * 60;

const AUDIO_TOPIC_NAME = 'audio-articles';

const cache = lru({
	max : 100,
	maxAge : tenMins 
});

// ripple through refactoring to use SAPI

module.exports = function(){
	const SAPI_URL_MINUS_KEY = `${CAPI_ENDPOINT}/search/v1`;
	const SAPI_URL = `${SAPI_URL_MINUS_KEY}?apiKey=${process.env.CAPI_KEY}`;

	const SEARCH_BODY = {
		"queryString": `topics:${AUDIO_TOPIC_NAME}`,
  		"queryContext" : {
  			"curations" : [ "ARTICLES", "BLOGS" ]
  		},
  		"resultContext" : {
  			"maxResults" : "100",
  			"offset" : "0",
  			"aspects" : [ "title", "location", "summary", "lifecycle", "metadata"]
  		}
  	};

	const cachedSearchResponse = cache.get(SAPI_URL_MINUS_KEY);

	if(cachedSearchResponse !== undefined){
		debug(`Delivering ${SAPI_URL_MINUS_KEY} from cache`);
		return Promise.resolve( cachedSearchResponse );
	}

	return fetch(SAPI_URL, {
		'method'       : 'POST', 
		'body'         :  JSON.stringify(SEARCH_BODY),
		'headers'      : {
  			'accept'       : 'application/json',
  			'content-type' : 'application/json'
  		}
	})
		.then(res => {
			if(res.status !== 200){
				throw `An error occurred retrieving ${SAPI_URL} with body=${JSON.stringify(SEARCH_BODY)},\nres=${JSON.stringify(res)}`;
			} else {
				return res;
			}
		})
		.then(res => res.json())
		.then(res => {
			cache.set(SAPI_URL_MINUS_KEY, res);
			return res;
		})
	;
}
