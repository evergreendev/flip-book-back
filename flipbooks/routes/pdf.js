var express = require('express');
const {formidable} = require("formidable");
const { readFileSync, writeFile} = require("node:fs");
const {join} = require("node:path");
var router = express.Router();


router.post('/upload', async function (req, res, next) {
    const form = formidable({});

    await form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }

        const file = files.file[0];
        const oldPath = file.filepath;
        const newPath = join(__dirname, "../../uploads", file.newFilename+".pdf");

        let rawData = readFileSync(oldPath)

        writeFile(newPath, rawData, function (err) {
            if (err) console.log(err)
            return res.send("Successfully uploaded")
        });
    });

})

module.exports = router;
