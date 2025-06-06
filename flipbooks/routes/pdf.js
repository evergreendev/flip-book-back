var express = require('express');
const {formidable} = require("formidable");
const { v4: uuidv4 } = require('uuid');
const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');
const {readFileSync, writeFile, unlink} = require("node:fs");
const {join} = require("node:path");
var router = express.Router();
const authCheck = require('../../session/middleware/authCheck');
const conversionQueue = require("../../queue");


router.post('/upload', authCheck, async function (req, res, next) {
    const form = formidable({
        keepExtensions: true
    });

    await form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }

        const file = files.file[0];
        const oldPath = file.filepath;

        const jobId = uuidv4();

        const newDirectory = join(__dirname, '../../uploads', jobId);

        fs.mkdir(newDirectory, {recursive: true}, (err) => {

            if (err) console.log(err)

            const newFilename = `${jobId}.pdf`;
            const newPath = join(newDirectory, newFilename);


            let rawData;

            try{
                rawData = readFileSync(oldPath);
            }catch(e){
                console.error('Error reading temp file:', e);
                return res.status(500).json({ error: 'Failed to read uploaded file.' });
            }

            writeFile(newPath, rawData, async function (err) {
                if (err) console.log(err)
                else {
                    await conversionQueue.add({jobId, pdfPath: newPath}, {
                        removeOnComplete: false,
                        removeOnFail: false,
                        attempts: 3,
                        backoff: {type: 'exponential', delay: 60000}
                    })
                    return res.status(202).send({
                        "jobId": jobId,
                        "message": "Successfully uploaded"
                    })
                }


            });
        })


    });

})

router.get('/status/:jobId', async (req, res) => {
    const jobs = await conversionQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const job = jobs.find(j => j.data.jobId === req.params.jobId);

    if (!job) {
        return res.status(404).json({ status: 'done' });
    }

    const state = await job.getState(); // e.g., 'waiting'|'active'|'completed'|'failed'
    if (state === 'waiting' || state === 'active') {
        return res.json({ status: 'pending' });
    }
    if (state === 'failed') {
        return res.json({ status: 'error', error: job.failedReason });
    }
    // state === 'completed'
    return res.json({ status: 'done', files: job.data.files });
});

router.delete('/', authCheck, async function (req, res, next) {
    if (!req.body.pathName) {
        return res.status(400).send({"message": "No path name provided"})
    }

    unlink(req.body.pathName, (err) => {
        if (err) return res.status(400).send({"message": "Failed to delete file"});

        return res.status(200).send({"message": "Successfully deleted file"});
    });
})

module.exports = router;
