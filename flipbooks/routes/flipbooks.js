var express = require('express');
var router = express.Router();
const Flipbook = require("../data/Flipbooks.js");
const Overlays = require("../data/Overlays.js");
const authCheck = require('../../session/middleware/authCheck');
const {formidable} = require("formidable");


router.get('/slug/:slug', async (req, res, next) => {
    const flipBook = await Flipbook.findBySlug(req.params.slug);
    if (flipBook?.status !== "published") {//If the flipbook isn't published move onto the authorized route to see if the user has access to the draft
        return next();
    }

    return res.status(200).send(flipBook);
})

router.get('/slug/:slug', authCheck, async (req, res, next) => {
    const flipBook = await Flipbook.findBySlug(req.params.slug);

    return res.status(200).send(flipBook);
})

router.get('/:flipbookId', authCheck, async (req, res) => {
    const flipBook = await Flipbook.findById(req.params.flipbookId)

    if (!flipBook) {
        return res.status(404).send('Not Found');
    }

    return res.status(200).send(flipBook);
})

router.get('/', authCheck, async (req, res) => {
    const flipBooks = await Flipbook.findAll(req.query.showDrafts);
    if (!flipBooks || !flipBooks.length) {
        return res.status(404).send([]);
    }

    return res.status(200).send(flipBooks);
})

router.get('/', async (req, res) => {
    const flipBooks = await Flipbook.findAll(false);
    if (!flipBooks || !flipBooks.length) {
        return res.status(404).send([]);
    }

    return res.status(200).send(flipBooks);
})

router.post('/', authCheck, async function (req, res, next) {
    const newFlipbook = await Flipbook.create(req.body);

    if (!newFlipbook) return res.status(400).send({"message": "Something went wrong"})

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

router.delete('/:id', authCheck, async function (req, res, next) {
    if (!req.params.id) {
        return res.status(400).send({"message": "No document found."});
    }
    const deleteSuccessful = await Flipbook.delete(req.params.id);

    if (!deleteSuccessful) {
        return res.status(204).send();
    }
})

router.get('/overlays/:flipbookId', async function (req, res) {
    const overlays = await Overlays.findByFlipbookId(req.params.flipbookId);

    return res.status(200).send(overlays);
})

router.post('/overlays', authCheck, async function (req, res, next) {
    if (!req.body) return res.status(400).send({"message": "No document found."});
    const overlay = await Overlays.upsert(req.body.id, req.body);

    return res.status(200).send({"overlay": overlay});
})

router.delete('/overlays/:id', authCheck, async function (req, res, next) {
    if (!req.params.id) {
        return res.status(400).send({"message": "No document found."});
    }
    await Overlays.delete(req.params.id);

    return res.status(204).send();
})

module.exports = router;
