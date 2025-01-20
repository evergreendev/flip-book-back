var express = require('express');
var router = express.Router();
var db = require('../data/database')

router.post('/', function(req, res, next) {
    const pool = db.getPool();

/*    pool.query("SELECT * FROM users", function(err, rows) {
        if (err) return next(err);

        res.send(rows)
    })*/

    res.send(JSON.stringify({user_token: "TEST2"}))//todo add login logic
});

module.exports = router;
