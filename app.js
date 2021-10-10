const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const indexRouter = require('./routes/index');
const fs = require('fs');
const app = express();
const config = require('./config.json');
const QLCplus = require('./bin/qlcplus');
const obsWebSocket = require('obs-websocket-js');
const obs = new obsWebSocket();
const qlc = new QLCplus();

console.log("LoistoTxt starting...");

CheckDir("./data");
CheckDir("./data/songs");
CheckDir("./data/shows");
CheckDir("./data/backgrounds");

if (config.obs.enabled) {
  connectObs();
}

if (config.qlc.enabled) {
  connectQlc();
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/background/", express.static(path.join(__dirname, 'data/backgrounds')));
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function CheckDir(directory) {
  try {
    if (!fs.existsSync(directory)) {
      console.log("Directory (" + directory + ") not exists. Creating one.");
      fs.mkdirSync(directory);
    }
    fs.accessSync(directory, fs.W_OK);
  } catch (err) {
    console.error("Data directory (" + directory + ") is not writable", err);
    console.log("Check your filesystem permissions and try again.\n");
    console.log("On linux you might wish to say:");
    console.log("sudo chmod 777 " + directory);

    process.exit(1);
  }
}


obs.on('error', err => {
  console.error('OBS websocket error:', err);
});

obs.on('AuthenticationFailure', err => {
  console.log("Authenticating OBS websocket failed.");
  console.log("Check your config.json and try again.");
  process.exit(1);
})

async function connectObs() {
  try {
    console.log("Connecting to local obs websocket!");

    await obs.connect({
      address: config.obs.websocket.address || "127.0.0.1:4444",
      password: config.obs.websocket.password || ""
    });

    console.log(`OBS Connected.`)
    return true;
  } catch (e) {
    console.log(`Error while connecting OBS websocket: ${e.error}!`);
    console.log('To recover, restart app or select at webview connect -> OBS');
    return false;
  }
}


async function connectQlc() {
  console.log("Connecting to QLC+ ...");
  return await qlc.connect();
}

module.exports = { app, obs, qlc };




