var express = require('express');
var router = express.Router();
var fs = require('fs');

router.get('/', function (req, res, next) {
  let titles = fs.readFileSync("./public/images/titles.svg").toString();
  res.render('display', { titles: titles });
});

router.get('/admin', function (req, res, next) {
  let data = "{}";
  if (fs.existsSync("./data/status.json")) {
    data = JSON.parse(fs.readFileSync("./data/status.json").toString());
  }
  const files = fs.readdirSync("./data/shows") ?? {};

  res.render('admin', { status: data, showFiles: files });
});

router.get('/admin/editsong', function (req, res, next) {
  res.render('editsong', { title: '', song: req.query.uuid || "" });
});

router.get('/ajax/songs', function (req, res, next) {
  let songs = fs.readdirSync("./data/songs");
  let outData = [];
  for (song of songs) {
    let info = JSON.parse(fs.readFileSync("./data/songs/" + song).toString());
    outData.push({ title: info.title, artist: info.artist, file: song });
  }
  res.json(outData);
});

router.get('/ajax/shows', function (req, res, next) {
  res.json(fs.readdirSync("./data/shows"));
});

router.get('/ajax/song', function (req, res, next) {
  res.json([]);
});

router.get('/ajax/song/:uuid', function (req, res, next) {
  let songData = {};
  let file = './data/songs/' + req.params.uuid.toString();
  if (fs.existsSync(file)) {
    songData = JSON.parse(fs.readFileSync(file).toString()) || {};
  } else {
    console.log("error, file not exists.");
  }

  res.json(songData);
});

router.post('/ajax/song', function (req, res, next) {
  let file = './data/songs/' + req.body.filename.replace(".json", "") + ".json";
  try {
    fs.writeFileSync(file, req.body.data || "[]");
  } catch (e) {
    console.log("Error while saving file: " + e);
  }
  res.sendStatus(200);
});

module.exports = router;
