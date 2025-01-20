var express = require('express');
var router = express.Router();
var db = require('../data/database')

/* GET users listing. */
router.get('/', function(req, res, next) {
  const pool = db.getPool();

  pool.query("SELECT * FROM users", function(err, rows) {
    if (err) return next(err);

    res.send(rows)
  })
});

module.exports = router;
