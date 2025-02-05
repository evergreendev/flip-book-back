var express = require('express');
const {formidable} = require("formidable");
const { readFileSync, writeFile, unlink} = require("node:fs");
const {join} = require("node:path");
var router = express.Router();
const authCheck = require('../../session/middleware/authCheck');


router.post('/upload', authCheck, async function (req, res, next) {
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
            return res.send({
                "filePath": file.newFilename+".pdf",
                "message":"Successfully uploaded"
            })
        });
    });

})

router.delete('/', authCheck, async function (req, res, next) {
    if (!req.body.pathName){
        return res.status(400).send({"message":"No path name provided"})
    }

    unlink(req.body.pathName, (err) => {
        if (err) return res.status(400).send({"message":"Failed to delete file"});

        return res.status(200).send({"message":"Successfully deleted file"});
    });
})

module.exports = router;
