const express = require('express');
const router = express.Router();
const fs = require('fs');
const config = require('../config.json');
let songCache = [];
let bgCache = [];

router.get('/video', function (req, res, next) {
  let titles = fs.readFileSync("./public/images/titles.svg").toString();
  res.render('displayVideo', { titles: titles });
});

router.get('/', function (req, res, next) {
  res.render('displayProjector');
});

router.get('/admin', function (req, res, next) {
  let data = "{}";
  if (fs.existsSync("./data/status.json")) {
    data = JSON.parse(fs.readFileSync("./data/status.json").toString());
  }
  const files = fs.readdirSync("./data/shows") ?? {};
  res.render('admin', { status: data, showFiles: files, config: config });
});

router.get('/admin/editsong', function (req, res, next) {
  res.render('editsong', { title: '', song: req.query.uuid || "" });
});

router.get('/ajax/backgrounds', function (req, res, next) {
  let bg = fs.readdirSync("./data/backgrounds");
  if (bgCache.length != bg.length) {
    console.log("Background cache!");
    bgCache = bg;
  }
  res.json({ data: bg });
});

router.get('/ajax/songs', function (req, res, next) {
  let songs = fs.readdirSync("./data/songs");
  if (songCache.length != songs.length) {
    console.log("Generating song cache!");
    songCache = [];
    for (song of songs) {
      let info = JSON.parse(fs.readFileSync("./data/songs/" + song).toString());
      songCache.push({ title: info.title, artist: info.artist, file: song, actions: "" });
    }
  }
  res.json({ data: songCache });
});

router.get('/ajax/shows', function (req, res, next) {
  let data = fs.readdirSync("./data/shows");
  let out = [];
  for (elem of data) {
    out.push({ file: elem });
  }
  res.json({ data: out });
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
