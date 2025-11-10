var express = require('express');
const Event = require("../data/Event");
const Impression = require("../data/Impression");
const Click = require("../data/Click");
const ReadSession = require("../data/ReadSession");
const Read = require("../data/Read.js");
var router = express.Router();

router.get('/', function (req, res) {
});

router.post('/', async function (req, res, next) {
    const eventType = req.body.eventType;
    const flipbookId = req.body.flipbookId;
    const pageNumber = req.body.pageNumber?.toString() || null;
    const sessionId = req.body.sessionId;
    const userId = req.body.userId || null;


    if (!eventType || !flipbookId || !sessionId) {
        console.log(req.body);
        return res.status(400).send({"message": "Missing required fields."});
    }

    const event = await Event.create(eventType, flipbookId, pageNumber, sessionId, userId);

    return res.status(200).send({"event": event});
});

router.post('/impression', async function (req, res, next) {
    try {
        const eventId = req.body.eventId;
        const impressionType = req.body.impressionType;
        const overlayId = req.body?.overlayId || null;

        if (!eventId || !impressionType) {
            return res.status(400).send({"message": "Missing required fields."});
        }

        const impression = await Impression.create(eventId, impressionType, overlayId);
        return res.status(200).send({impression});
    } catch (err) {
        console.error(err);
        return res.status(500).send({message: 'Failed to create impression event.'});
    }
})

router.post('/click', async function (req, res, next) {
    try {
        const clickType = req.body.clickType || null;
        const href = req.body.href || null;
        const overlayId = req.body?.overlayId || null;
        const eventId = req.body?.eventId || null;

        if (!eventId && !overlayId) {
            return res.status(400).send({"message": "Missing required fields."});
        }

        const click = await Click.create(eventId, clickType, overlayId, href);
        return res.status(200).send({click});

    } catch (err) {

    }
});

router.post('/read-session', async function (req, res, next) {
    try {
        const sessionId = req.body.sessionId || null;

        if (!sessionId) {
            return res.status(400).send({"message": "Missing required fields."});
        }

        const readSession = await ReadSession.create(sessionId);
        return res.status(200).send({readSession});

    } catch (e) {

    }
})

router.post('/read-session/heartbeat', async function (req, res, next) {
    const id = req.body.id;
    const updateLastSeen = req.body.updateLastSeen || false;

    if (!id) {
        return res.status(400).send({"message": "Missing required fields."});
    }

    const session = await ReadSession.heartbeat(id, updateLastSeen);

    res.status(200).send({session});
})

router.post('/read', async function (req, res) {

    for (let timeInfo of req.body) {
        const event = await Event.create(
            "read",
            timeInfo.flipbookId,
            timeInfo.page,
            timeInfo.sessionId,
            null
        );

        await Read.create(event.id, timeInfo.readSession,  timeInfo.idempotencyKey, timeInfo.ms, timeInfo.seq, timeInfo.ts_ms );
    }

    res.status(200).send({message: "read"})
})

router.get('/read/:flipbookId', async function (req, res) {
    const id = req.params.flipbookId;

    const reads = await Read.findByFlipbookId(id);

    res.status(200).send(reads);
})

module.exports = router;
