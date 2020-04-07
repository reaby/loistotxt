var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var fs = require('fs');

var app = express();
console.log("LoistoTxt starting...");

CheckDir("./data");
CheckDir("./data/songs");
CheckDir("./data/shows");


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'data/songs')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

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

module.exports = app;




