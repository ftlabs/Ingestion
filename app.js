const debug = require('debug')('app');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hsts = require('hsts');
const express_enforces_ssl = require('express-enforces-ssl');
const padTime = require('./bin/lib/pad-time');

const hbs = require('hbs');

hbs.registerHelper('unix', function(value) {
  const d = padTime(new Date(value * 1000));
  return `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}`;
});

hbs.registerHelper('unixWithTime', function(value) {
  const d = padTime(new Date(value * 1000));
  return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} ${d.getDate()}/${d.getMonth()}/${d.getFullYear()}`;
});

hbs.registerHelper('datestamp', function(value) {
  debug(value);
  const d = padTime(new Date(value));
  return `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}`;
});

const app = express();

if(process.env.ENVIRONMENT !== "dev"){
  app.use(hsts({ maxAge: 7776000000, force: true })); // 90 
  app.enable('trust proxy');
  app.use(express_enforces_ssl());
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
// app.use(bodyParser());
app.use(bodyParser.urlencoded({
  extended: true
}));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/redirect'));
app.use('/ft', require('./routes/ft'));
app.use('/feed', require('./routes/feed'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
