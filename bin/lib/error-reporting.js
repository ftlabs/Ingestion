const raven = require('raven');
const client = new raven.Client(process.env.SENTRY_DSN);

module.exports = function(err){
	client.captureException(err);
}