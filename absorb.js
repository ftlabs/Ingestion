const fs = require('fs');
const AWS = require('aws-sdk');
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const debug = require('debug')('absorb');

const extract = require('./bin/lib/extract-uuid');
const audit = require('./bin/lib/audit');
const database = require('./bin/lib/database');
const mail = require('./bin/lib/mailer');
const generateS3PublicURL = require('./bin/lib/get-s3-public-url');

const S3 = new AWS.S3();

const ingestorAdminUrl = process.env.ADMIN_URL || 'no Admin URL specified';

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

function seperateQueryParams(queryString){

	const data = {};

	queryString = queryString.split('?')[1].split('&').forEach(parameter => {
		const keyAndValue = parameter.split('=');

		if(keyAndValue[1] !== ""){
			data[keyAndValue[0]] = decodeURIComponent(keyAndValue[1]);
		}

	});

	return data;

}

function checkForData(){
	debug("Checking for data at", process.env.AUDIO_RSS_ENDPOINT);
	audit({
		user : "ABSORBER",
		action : 'checkForAudioFiles'
	});
	fetch(process.env.AUDIO_RSS_ENDPOINT)
		.then(res => res.text())
		.then(text => parseRSSFeed(text))
		.then(feed => {
			debug(feed);
			feed.channel[0].item.forEach(item => {
				// Let's check to see if we've already retrieved this item from SL
				extract( item['guid'][0]._ )
					.then(itemUUID => {

						if(itemUUID === undefined){
							return false;
						}

						const audioURL = item.enclosure[0]['$'].url;
						const metadata = seperateQueryParams(audioURL);
						metadata.uuid = itemUUID;
						metadata.originalURL = audioURL.split('?')[0];

						debug(itemUUID);
						debug(audioURL);

						database.read({ uuid : itemUUID }, process.env.AWS_METADATA_TABLE)
							.then(item => {

								if(Object.keys(item).length < 1){
									
									debug(`Item ${itemUUID} has no meta data in database. Adding...`, metadata);

									database.write(metadata, process.env.AWS_METADATA_TABLE)
										.then(function(){
											debug(`Item ${itemUUID} in DynamoDB`, metadata);
								
											database.read({uuid : itemUUID}, process.env.AWS_DATA_TABLE)
												.then(d => {

													if(d.Item !== undefined){
														
														const madeAvailable = d.Item.madeAvailable;
														const voiced = new Date(metadata['date-voiced']) / 1000;
														
														if(voiced - madeAvailable > 0){
														
															debug(`Date voiced: ${voiced} Made Available: ${madeAvailable} Turnaround: ${voiced - madeAvailable} seconds`);
															d.Item.turnaround = voiced - madeAvailable;
															database.write(d.Item, process.env.AWS_DATA_TABLE)
														
														}

													}


												})
												.catch(err => {
													debug(`An error occurred writing the turnaround time for ${itemUUID}`, err);
												})
											;

										})
										.catch(err => {
											debug("An error occurred when writing audio meta data to the metadata table.", err, metadata);
										})
									;
								}

							})
							.catch(err => {
								debug(`Database read (${process.env.AWS_METADATA_TABLE}) error for ${itemUUID}`, err);
							})
						;

						S3.headObject({
							Bucket : process.env.AWS_AUDIO_BUCKET,
							Key : `${itemUUID}.mp3`
						}, function (err) { 

							if (err && err.code === 'NotFound') {
								// We don't have that audio file, let's grab it
								debug(`We dont have the audio for ${itemUUID}. Fetching from ${item.link}`);
								
								debug(item);

								fetch(audioURL)
									.then(function(res) {
										return res.buffer();
									}).then(function(buffer) {
										debug(buffer);
										S3.putObject({
											Bucket : process.env.AWS_AUDIO_BUCKET,
											Key : `${itemUUID}.${process.env.SL_MEDIA_FORMAT || 'mp3'}`,
											Body : buffer,
											ACL : 'public-read'
										}, function(err){
											if(err){
												debug(err);
											}

											mail.send({
														itemUUID: itemUUID,
												           title: item['title'] || 'no title specified',
												       ftCopyUrl: generateS3PublicURL(itemUUID),
												       slCopyUrl: metadata.originalURL,
												ingestorAdminUrl: ingestorAdminUrl
											});

											audit({
												user : "ABSORBER",
												action : 'getAudioFile',
												article : itemUUID
											});
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