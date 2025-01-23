var express = require('express');
var router = express.Router();
const User = require("../data/User");

/* GET users listing. */
router.get('/', async function (req, res, next) {
  const users = await User.findAll();

  res.send(users);
});

router.post('/', async function (req, res, next) {
  const users = await User.findAll();

  if(users.length > 0){ //todo add a way to register users if you have a valid token
    res.send("User already exists");
  }



  await User.create(req.body);

})

module.exports = router;
