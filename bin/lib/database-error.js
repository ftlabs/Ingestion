const debug = require('debug')('bin:lib:database-error');

module.exports = function (res, message, err){
	debug(err);
	res.status(500);
	res.render('error', {
		message : message,
		error : {
			stack : err
		}
	})
}