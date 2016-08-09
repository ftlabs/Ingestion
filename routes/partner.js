const express = require('express');
const router = express.Router();
const auth = require('basic-auth');

router.get('/', function(req, res, next) {
  res.render('content', { title: 'FT Content' });
});

router.get('/:uuid', function(req, res, next) {
	const credentials = auth(req);

	if (!credentials || credentials.name !== process.env.BASIC_AUTH_USER || credentials.pass !== process.env.BASIC_AUTH_PATH) {
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="example"')
		res.end('Access denied')
	} else {
		res.send('OK');
	}

});

module.exports = router;
