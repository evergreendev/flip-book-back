var express = require('express');
var router = express.Router();
var authCheck = require('../../auth/middleware/authCheck');
var Session = require('../data/Session');

/* GET sessions listing. */
router.get('/', async function (req, res) {
    const sessions = await Session.findAll();

    res.send(sessions);
});

router.post('/', async function (req, res, next) {
  /*  const sessions = await Session.findAll();

    if(sessions.length > 0){
        next();
        return;
    }*/
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer || req.headers.referrer || '';

    const session = await Session.create(clientIp, userAgent, referrer);

    res.status(200).send(JSON.stringify(session.id));
})

module.exports = router;
