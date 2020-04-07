var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('display', { title: '' });
});

router.get('/preview', function (req, res, next) {
  res.render('preview', { title: '' });
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
  let file = './data/songs/' + req.params.uuid + ".json";
  if (fs.existsSync(file)) {
    songData = JSON.parse(fs.readFileSync(file).toString()) || {};
  }

  res.json(songData);
});

router.post('/ajax/song', function (req, res, next) {  
  let file = './data/songs/' + req.body.filename + ".json";
  fs.writeFileSync(file, req.body.data || "[]");

  res.sendStatus(200);
});

module.exports = router;
