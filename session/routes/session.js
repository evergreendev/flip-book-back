var express = require('express');
var router = express.Router();
var Session = require('../data/Session');

router.post('/', async function (req, res, next) {
    const tokens = await Session.create(req.body);

    if (!tokens) return res.status(401).send({error: "Invalid Login"});

    res.send(JSON.stringify({
        user_token: tokens.userToken,
        refresh_token: tokens.refreshToken
    }));
});

router.post('/validate', async function (req, res, next) {
    const sessionToken = await Session.checkClaim(req.body.token);

    if (!sessionToken) return res.status(401).send({error: "Expired Token"});

    res.send(JSON.stringify({user_token: sessionToken}));
});

router.post('/refresh', async function (req, res, next) {
    const tokens = await Session.refreshToken(req.body.refresh_token);


    if (!tokens) return res.status(401).send({error: "Invalid or Expired Refresh Token"});

    res.send(JSON.stringify({user_token: tokens.userToken}));
});

module.exports = router;
