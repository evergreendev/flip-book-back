require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./users/routes/users');
var authRouter = require('./auth/routes/auth');
var pdfRouter = require('./flipbooks/routes/pdf');
var cors = require('cors')
const flipbooksRouter = require('./flipbooks/routes/flipbooks');

var app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pdfs',express.static(path.join(__dirname, 'uploads')));
app.use('/thumbnails',express.static(path.join(__dirname, 'uploads/thumbnails')));

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/flipbooks', flipbooksRouter);
app.use('/pdf', pdfRouter);

module.exports = app;
