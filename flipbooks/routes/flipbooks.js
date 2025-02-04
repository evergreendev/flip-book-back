var express = require('express');
var router = express.Router();
const Flipbook = require("../data/Flipbooks.js");
const authCheck = require('../../session/middleware/authCheck');


router.post('/', authCheck, async function (req, res, next) {
    const newFlipbook = await Flipbook.create(req.body);

    if (!newFlipbook) return res.status(400).send({"message":"Something went wrong"})

    return res.status(200).send({"flipbook": newFlipbook})
})

router.delete('/', authCheck, async function (req, res, next) {
    if (!req.body.id){
        return res.status(400).send({"message":"No document found."});
    }
    const deleteSuccessful = await Flipbook.delete(req.body.id);

    if (!deleteSuccessful) {
        return res.status(200)
    }
})

module.exports = router;
