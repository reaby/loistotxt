var express = require('express');
var router = express.Router();
var fs = require('fs');

router.get('/', function (req, res, next) {
  let titleData = fs.readFileSync("./public/images/titles.svg").toString();
  res.render('display', { titles: titleData });
});

router.get('/admin', function (req, res, next) {
  res.render('admin', { title: '' });
});

router.get('/admin/editsong', function (req, res, next) {
  res.render('editsong', { title: '', song: req.query.uuid || "" });
});

router.get('/ajax/song', function (req, res, next) {
  res.json([]);
});

router.get('/ajax/song/:uuid', function (req, res, next) {
  let songData = {};
  let file = './data/songs/' + req.params.uuid.toString() + ".json";
  if (fs.existsSync(file)) {
    songData = JSON.parse(fs.readFileSync(file).toString()) || {};
  } else {
    console.log("error, file not exists.");
  }

  res.json(songData);
});

router.post('/ajax/song', function (req, res, next) {
  let file = './data/songs/' + req.body.filename + ".json";
  fs.writeFileSync(file, req.body.data || "[]");

  res.sendStatus(200);
});

module.exports = router;
