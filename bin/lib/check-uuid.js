const extractUUID = require('./extract-uuid');
const getContent = require('./content');

module.exports = function(UUID){

	return extractUUID(UUID)
		.then(UUID => {
			return getContent(UUID)
				.then(res => {
					return Promise.resolve(UUID);
				})
				.catch(err => {
					return Promise.reject(err);
				})
			;
		})
		.catch(err => {
			return Promise.reject(err);
		})
	;

}