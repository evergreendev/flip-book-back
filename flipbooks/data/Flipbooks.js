const db = require('../../data/database');
const {v4: uuidv4} = require('uuid');

const pool = db.getPool();

module.exports = {
    findById: async function (id) {
        const [flipbooks] = await pool.execute("SELECT * FROM flipbooks where id=?", [id]);

        return flipbooks;
    },
    findAll: async function () {
        const [flipbooks] = await pool.execute("SELECT * FROM flipbooks", []);

        return flipbooks;
    },
    create: async function (flipbook) {
        if (!flipbook || !flipbook.pdfPath) return null;
        let status = flipbook.status ? flipbook.status : "draft";
        if (status !== "draft" && status !== "published" && status !== "private") {
            status = "draft";
        }

        const [newFlipbook] = 
            await pool.execute("INSERT INTO flipbooks (id, pdf_path, path_name, status, password, title) VALUES (?, ?, ?, ?, ?,?)",
                [uuidv4(), flipbook.pdfPath, flipbook.pathName, status, flipbook.password||null, flipbook.title]);

        return newFlipbook;
    }
}
