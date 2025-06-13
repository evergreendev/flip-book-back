const db = require('../../data/database');
const {v4: uuidv4} = require('uuid');
const slugify = require("slugify");

const pool = db.getPool();

module.exports = {
    findById: async function (id) {
        const [flipbooks] = await pool.execute("SELECT * FROM flipbooks where id=?", [id]);

        return flipbooks[0];
    },
    findBySlug: async function (slug) {
        console.log(slug)
        const [flipbooks] = await pool.execute("SELECT * FROM flipbooks where path_name=?", [slug]);

        return flipbooks[0];
    },
    findAll: async function (showDrafts) {
        if (showDrafts){
            const [flipbooks] = await pool.execute("SELECT * FROM flipbooks", []);

            return flipbooks;
        }
        else {
            const [flipbooks] = await pool.execute("SELECT * FROM flipbooks where NOT (status = 'draft')", []);

            return flipbooks;
        }

    },
    create: async function (flipbook) {
        if (!flipbook || !flipbook.pdfPath) return null;
        let status = flipbook.status ? flipbook.status : "draft";
        if (status !== "draft" && status !== "published" && status !== "private") {
            status = "draft";
        }

        const flipbookId = flipbook.pdfPath;

        const [results] =
            await pool.execute("INSERT INTO flipbooks (id, pdf_path, path_name, status, password, title) VALUES (?, ?, ?, ?, ?,?)",
                [flipbookId, flipbook.pdfPath, flipbook.pathName||null, status, flipbook.password||null, flipbook.title||null]);

        if(!results) return null;

        const [newFlipbook] = await pool.execute("SELECT id, pdf_path, path_name, status, title FROM flipbooks WHERE id = ?", [flipbookId]);

        return newFlipbook[0];
    },
    update: async function (flipbookId, fields) {
        if (!fields || !flipbookId) return null;

        const [currResults] = await pool.execute("SELECT * FROM flipbooks WHERE id = ?", [flipbookId]);
        if (!currResults) return null;

        const currFlipbook = currResults[0];

        const title = fields?.title?.[0] || "untitled flipbook";
        const path = fields?.path?.[0] || slugify(title,{lower:true});
        const isDraft = fields.isDraft;

        await pool.execute("UPDATE flipbooks SET title=?, path_name=?, status=? WHERE id = ?",[title,path,isDraft ? "draft":"published", flipbookId]);

        return currFlipbook;
    },
    delete: async function (id) {
        if (!id) return null;
        const [results] =
            await pool.execute("DELETE FROM flipbooks where id = ?", [id]);

        if(!results) return null;

        return results;
    }
}
