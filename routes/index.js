var express = require('express');
var router = express.Router();
var fs = require('fs');

router.get('/', function (req, res, next) {
  let titles = fs.readFileSync("./public/images/titles.svg").toString();
  res.render('display', { titles: titles });
});

router.get('/admin', function (req, res, next) {
  let data = "{}";
  if (fs.existsSync("./data/titles.json")) {
    data = JSON.parse(fs.readFileSync("./data/titles.json").toString());
  }
  res.render('admin', { titleData: data });
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
  try {
    fs.writeFileSync(file, req.body.data || "[]");
  } catch (e) {
    console.log("Error while saving file: " + e);
  }
  res.sendStatus(200);
});

module.exports = router;
