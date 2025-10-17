require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const usersRouter = require('./users/routes/users');
const authRouter = require('./auth/routes/auth');
const sessionRouter = require('./sessions/routes/sessions');
const pdfRouter = require('./flipbooks/routes/pdf');
const cors = require('cors');
const flipbooksRouter = require('./flipbooks/routes/flipbooks');

const app = express();

app.set('trust proxy', true);

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
app.use('/session', sessionRouter);
app.use('/flipbooks', flipbooksRouter);
app.use('/pdf', pdfRouter);

module.exports = app;
