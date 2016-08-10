const express = require('express');
const router = express.Router();
const S3O = require('s3o-middleware');
const isUUID = require('is-uuid');
const MongoClient = require('mongodb').MongoClient;

router.use(S3O);

/* GET home page. */

router.get('/', function(req, res, next){

  res.render('list-exposed-articles', {title : "Accessible Articles"});

});

router.get('/add', function(req, res, next) {
  res.render('expose-article', { title: 'Expose an article' });
});

router.post('/add', (req, res, next) => {
  console.log(req.body);
  let articleUUID = req.body.uuid;

  let uuidRegex = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/i;
  let matchedUUID = uuidRegex.exec(articleUUID);

  articleUUID = matchedUUID ? matchedUUID[1] : null; 

  console.log("UUID:", articleUUID);

  if(!articleUUID || !isUUID.anyNonNil(articleUUID)){
    res.redirect("/ft/add?success=false");
    return
  } else {
    
    const mongoURL = process.env.MONGO_ENDPOINT;

    MongoClient.connect(mongoURL, function(err, db) {

      if(err){
        console.log(err);
      }
      
      var collection = db.collection('articles');
      collection.insertOne({
        uuid : articleUUID
      }, function(err, result){

        if(err){
          console.log(err);
          res.status(500);
          res.end();
          return;
        } else {
          console.log(articleUUID, 'has been exposed to 3rd parties');
          res.redirect("/ft/add?success=true");
        }


      })

    });

  }

});

module.exports = router;
