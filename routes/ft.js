const express = require('express');
const router = express.Router();
const S3O = require('s3o-middleware');

router.use(S3O);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('ft-uuid', { title: 'Visible Articles' });
});

module.exports = router;
