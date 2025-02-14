var express = require('express');
var router = express.Router();
const Flipbook = require("../data/Flipbooks.js");
const authCheck = require('../../session/middleware/authCheck');
const {formidable} = require("formidable");


router.get('/:flipbookId', authCheck, async (req, res) => {
    const flipBook = await Flipbook.findById(req.params.flipbookId)

    if (!flipBook) {return res.status(404).send('Not Found');}

    return res.status(200).send(flipBook);
})

router.get('/', authCheck, async (req, res) => {
    const flipBooks = await Flipbook.findAll(req.query.showDrafts);
    if (!flipBooks || !flipBooks.length) {return res.status(404).send([]);}

    return res.status(200).send(flipBooks);
})

router.get('/', async (req, res) => {
    const flipBooks = await Flipbook.findAll(false);
    if (!flipBooks || !flipBooks.length) {return res.status(404).send([]);}

    return res.status(200).send(flipBooks);
})

router.post('/', authCheck, async function (req, res, next) {
    const newFlipbook = await Flipbook.create(req.body);

    if (!newFlipbook) return res.status(400).send({"message":"Something went wrong"})

    return res.status(200).send({"flipbook": newFlipbook})
})

router.put('/:flipbookId', authCheck, async function (req, res, next) {
    const form = formidable({});

    await form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }


        const updatedFlipbook = await Flipbook.update(req.params.flipbookId, fields);
        return res.status(200).send({"flipbook": updatedFlipbook});
    });

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
