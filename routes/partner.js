var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('content', { title: 'FT Content' });
});

router.get('/:uuid', function(req, res, next) {

	res.send('OK');
});

module.exports = router;
