require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./users/routes/users');
var sessionRouter = require('./session/routes/session');
var pdfRouter = require('./flipbooks/routes/pdf');
var authCheck = require('./session/middleware/authCheck');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/session', sessionRouter);
app.use(authCheck);//Every route below needs to be authorized
app.use('/pdf', pdfRouter);

module.exports = app;
