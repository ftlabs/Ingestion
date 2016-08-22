const fs = require('fs');
const AWS = require('aws-sdk');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const debug = require('debug')('absorb');
const extract = require('./bin/lib/extract-uuid');

const S3 = new AWS.S3();

let poll = undefined;

function parseRSSFeed(text){

	return new Promise((resolve, reject) => {

		xml2js.parseString(text, (err, result) => {

			if(err){
				reject(err);
			} else {
				resolve(result.rss);
			}

		});

	});

}

function checkForData(){
	debug("Checking for data at", process.env.AUDIO_RSS_ENDPOINT);

	fetch(process.env.AUDIO_RSS_ENDPOINT)
		.then(res => res.text())
		.then(text => parseRSSFeed(text))
		.then(feed => {
			// debug(feed);
			feed.channel[0].item.forEach(item => {
				// Let's check to see if we've already retrieved this item from SL
				const itemUUID = extract( item['guid'][0]._ )
					.then(itemUUID => {

						if(itemUUID === undefined){
							return false;
						}

						const audioURL = item.enclosure[0]['$'].url;

						debug(itemUUID);
						debug(audioURL);

						S3.headObject({
							Bucket : process.env.AWS_AUDIO_BUCKET,
							Key : `${itemUUID}.mp3`
						}, function (err, metadata) { 

							if (err && err.code === 'NotFound') {
								// We don't have that audio file, let's grab it
								debug(`We don't have the audio for ${itemUUID}. Fetching from ${item.link}`);
								
								debug(item);

								fetch(audioURL)
									.then(function(res) {
										return res.buffer();
									}).then(function(buffer) {
										debug(buffer);
										S3.putObject({
											Bucket : process.env.AWS_AUDIO_BUCKET,
											Key : `${itemUUID}.${process.env.SL_MEDIA_FORMAT || 'mp3'}`,
											Body : buffer
										}, function(err){
											if(err){
												debug(err);
											}
										})
									})
									.catch(err => {
										debug(err);
									})
								;

							} else if(err){
								debug("An error occurred querying the S3 bucket", err);
							} else {
								debug(`The audio for ${itemUUID} is already in the S3 bucket`);

							}

						});

					})
				;


			});

		})
		.catch(err => {
			debug(err);
		})
	;

}

function startPolling(interval, now){

	now = now || false;

	if(process.env.AUDIO_RSS_ENDPOINT === undefined){
		debug("AUDIO_RSS_ENDPOINT environment variable is undefined. Will not poll.");
		return false;
	}

	if(process.env.AWS_AUDIO_BUCKET === undefined){
		debug('AWS_AUDIO_BUCKET environment variable is not defined. Will not poll.');
		return false;
	}

	poll = setInterval(checkForData, interval);
	if(now){
		checkForData();
	}

	return true;
}

function stopPolling(){
	clearInterval(poll);
}

module.exports = {
	poll : startPolling,
	stop : stopPolling
};