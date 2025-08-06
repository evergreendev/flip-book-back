const Auth = require("../data/Auth");

async function isAuthorized(req, res, next) {
    if (!req.headers.authorization) return false;

    const token = req.headers.authorization.split(' ')[1];

    if (!token) return res.status(401).send('Unauthorized');

    const tokenIsValid = await Auth.checkClaim(token);

    if (!tokenIsValid) return res.status(401).send('Unauthorized');

    next();
}

module.exports = isAuthorized;
