var express = require('express');
var router = express.Router();
const User = require("../data/User");
var authCheck = require('../../session/middleware/authCheck');

/* GET users listing. */
router.get('/', async function (req, res) {
  const users = await User.findAll();

  res.send(users);
});

router.post('/', async function (req, res, next) {
  const users = await User.findAll();

  if(users.length > 0){
    next();
    return;
  }

  await User.create(req.body);

  res.status(200).send('success');
})

router.post('/',authCheck, async function (req, res) {
  await User.create(req.body);

  res.status(200).send('success');
})

module.exports = router;
