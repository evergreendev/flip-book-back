var express = require('express');
var router = express.Router();
var authCheck = require('../../auth/middleware/authCheck');
var Session = require('../data/Session');

/* GET sessions listing. */
router.get('/', async function (req, res) {
    const sessions = await Session.findAll();

    res.send(sessions);
});

router.get('/:id', async function (req, res) {
    const session = await Session.findById(req.params.id);

    if (!session) {
        return res.status(404).send({message: "Session not found"});
    }

    res.send(session);
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

    console.log(clientIp, userAgent, referrer);

    const session = await Session.create(clientIp, userAgent, referrer);

    console.log(session);

    res.status(200).send(JSON.stringify(session.id));
})

router.post('/cron/end', async function (req, res, next) {
    await Session.cronEndSessions();

    res.status(200).send();
})

router.post('/heartbeat', async function (req, res, next) {
    const sessionId = req.body.sessionId;
    const updateLastSeen = req.body.updateLastSeen || false;

    if(!sessionId){
        return res.status(400).send({"message": "Missing required fields."});
    }

    const session = await Session.heartbeat(sessionId, updateLastSeen);

    res.status(200).send({session});
})

module.exports = router;
