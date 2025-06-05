var express = require('express');
const {formidable} = require("formidable");
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
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

function pdfToPngPages(pdfPath, outputFolder, dpi = 150, callback) {
    // Ensure output directory exists
    fs.mkdirSync(outputFolder, { recursive: true });

    // Build the command.
    // pdfPath: absolute path to the .pdf
    // outputPattern: outputFolder + '/page'
    const outputPattern = path.join(outputFolder, 'page');
    const cmd = `pdftoppm -png -rx ${dpi} -ry ${dpi} "${pdfPath}" "${outputPattern}"`;

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            return callback(new Error(stderr || err.message));
        }
        // Collect list of generated PNGs
        fs.readdir(outputFolder, (reErr, files) => {
            if (reErr) return callback(reErr);
            // Filter only “page-<n>.png”
            const pngFiles = files
                .filter(f => f.match(/^page-\d+\.png$/))
                .map(f => path.join(outputFolder, f))
                .sort(); // page-1.png, page-2.png, …
            callback(null, pngFiles);
        });
    });
}

router.get('/thumbnail/:filename', async function (req, res, next) {
    const filename = req.params.filename;
    const pdfPath = join(__dirname, "../../uploads", filename);

    /*    // Check if the PDF file exists
        if (!existsSync(pdfPath)) {
            return res.status(404).send({"message": "PDF file not found"});
        }*/

    try {
        // Output directory for the PNG
        const outputDir = join(__dirname, "../../uploads/thumbnails");


        pdfToPngPages(pdfPath, outputDir, 150, (err, pngPaths) => {
            // Send the PNG file

            if (pngPaths){
                console.log(pngPaths);
                res.setHeader('Content-Type', 'image/png');
                return res.sendFile(pngPaths[0]);
            }else{
                return res.status(404).send({"message": "Error generating thumbnail"});
            }
        })

    } catch (error) {
        console.error("Error generating thumbnail:", error);
        return res.status(500).send({"message": "Error generating thumbnail", "error": error.message});
    }
});

module.exports = router;
