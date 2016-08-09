const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('auth', { title: 'Where to?' });
});

module.exports = router;
