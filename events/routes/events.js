var express = require('express');
const Event = require("../data/Event");
const Impression = require("../data/Impression");
var router = express.Router();

router.get('/', function (req, res) {
});

router.post('/', async function (req, res, next) {
    const eventType = req.body.eventType;
    const flipbookId = req.body.flipbookId;
    const pageNumber = req.body.pageNumber?.toString() || null;
    const sessionId = req.body.sessionId;
    const userId = req.body.userId || null;




    if(!eventType || !flipbookId || !sessionId){
        console.log(req.body);
        return res.status(400).send({"message": "Missing required fields."});
    }

    const event = await Event.create(eventType, flipbookId, pageNumber, sessionId, userId);

    return res.status(200).send({"event": event});
});

router.post('/impression', async function(req, res,next){
    try {
        const eventId = req.body.eventId;
        const impressionType = req.body.impressionType;
        const overlayId = req.body?.overlayId || null;

        if(!eventId || !impressionType){
            return res.status(400).send({"message": "Missing required fields."});
        }

        const impression = await Impression.create(eventId, impressionType, overlayId);
        return res.status(200).send({ impression });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Failed to create impression event.' });
    }
})

module.exports = router;
