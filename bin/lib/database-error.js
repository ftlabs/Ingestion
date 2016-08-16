module.exports = function (res, message, err){
	console.log(err);
	res.status(500);
	res.render('error', {
		message : message,
		error : {
			stack : err
		}
	})
}