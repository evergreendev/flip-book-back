var express = require('express');
var router = express.Router();
var Session = require('../data/Session');

router.post('/', async function (req, res, next) {
    const sessionToken = await Session.create(req.body);

    if (!sessionToken) return res.status(401).send({error: "Invalid Login"});

    res.send(JSON.stringify({user_token: sessionToken}))
});

router.post('/validate', async function (req, res, next) {
    const sessionToken = await Session.checkClaim(req.body.token);

    if (!sessionToken) return res.status(401).send({error: "Expired Token"});

    res.send(JSON.stringify({user_token: sessionToken}))
})

module.exports = router;
