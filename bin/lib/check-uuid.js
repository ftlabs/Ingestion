const isUUID = require('is-uuid');

module.exports = function(UUID){
	let articleUUID = UUID;

	let uuidRegex = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/i;
	let matchedUUID = uuidRegex.exec(articleUUID);

	articleUUID = matchedUUID ? matchedUUID[1] : null; 

	console.log("UUID:", articleUUID);

	if(!articleUUID || !isUUID.anyNonNil(articleUUID)){
		return false;
	} else {
		return articleUUID;
	}

}