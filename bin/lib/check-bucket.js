const AWS = require('aws-sdk');
const S3 = new AWS.S3();

module.exports = function(UUID){

	return new Promise( (resolve, reject) => {

		S3.headObject({
			Bucket : process.env.AWS_AUDIO_BUCKET,
			Key : `${UUID}.mp3`
		}, function (err, metadata) { 

			if (err && err.code === 'NotFound') {
				resolve(false);
			} else if(!err) {
				resolve(true);
			}

		});

	})

};