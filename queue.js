// queue.js
const Queue = require('bull');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;

// 1) Create (or connect to) your Bull queue
//    “pdf‐to‐png” is an arbitrary name; Bull will use this to form Redis keys.
const conversionQueue = new Queue('pdf‐to‐png', {
    redis: { host: '127.0.0.1', port: 6379 }
});

// 2) Register a “processor” that Bull will call whenever a new job arrives.
//    This callback is effectively “always listening” in the background.
conversionQueue.process(async (job, done) => {
    try {
        const { jobId, pdfPath } = job.data;
        const uploadDir = path.join(__dirname, 'uploads', jobId);
        const outputPrefix = path.join(uploadDir, 'page');

        // Spawn pdftoppm to render PNGs
        const converter = spawn('pdftoppm', [
            '-png',
            '-rx', '200',
            '-ry', '200',
            pdfPath,
            outputPrefix
        ]);

        let stderr = '';
        converter.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        converter.on('close', async (code) => {
            if (code !== 0) {
                // Tell Bull the job failed (stores failure reason in Redis)
                return done(new Error(stderr || `pdftoppm exited with code ${code}`));
            }

            // On success, gather all the generated PNGs
            const allFiles = await fs.readdir(uploadDir);
            const pngFiles = allFiles
                .filter(f => f.endsWith('.png'))
                .map(f => path.join(uploadDir, f))
                .sort();

            // Update job data so your “status” endpoint can see the file list
            await job.update({ ...job.data, files: pngFiles });
            done(); // mark as completed
        });
    } catch (err) {
        // If an unexpected error occurs, signal a failure
        done(err);
    }
});

module.exports = conversionQueue;
