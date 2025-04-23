const db = require('../../data/database');
const {v4: uuidv4} = require('uuid');

const pool = db.getPool();

module.exports = {
    findById: async function (id) {
        const [overlays] = await pool.execute("SELECT * FROM overlays where id=?", [id]);

        return overlays[0];
    },
    findByFlipbookId: async function (flipBookId) {
        const [overlays] = await pool.execute("SELECT * FROM overlays WHERE flipbook_id=?", [flipBookId]);

        return overlays;
    },
    create: async function (overlay) {
        if (!overlay) return null;

        const overlayId = uuidv4();

        const [results] =
            await pool.execute("INSERT INTO overlays (id, flipbook_id, x, y, w, h, url, page) VALUES (?, ?, ?, ?, ?,?,?,?)",
                [overlayId, overlay.flipbook_id, overlay.x, overlay.y, overlay.w, overlay.h, overlay.url, overlay.page]);

        if (!results) return null;

        const [newOverlay] = await pool.execute("SELECT * FROM overlays WHERE id = ?", [overlayId]);

        return newOverlay[0];
    },
    upsert: async function (overlayId, fields) {
        const [currResults] = await pool.execute("SELECT * FROM overlays WHERE id = ?", [overlayId]);
        const currOverlay = currResults[0];
        if (!currOverlay){
            const overlayId = uuidv4();

            const [results] =
                await pool.execute("INSERT INTO overlays (id, flipbook_id, x, y, w, h, url, page) VALUES (?, ?, ?, ?, ?,?,?,?)",
                    [overlayId, fields.flipbook_id, fields.x, fields.y, fields.w, fields.h, fields.url, fields.page]);

            if (!results) return null;

            const [newOverlay] = await pool.execute("SELECT * FROM overlays WHERE id = ?", [overlayId]);

            return newOverlay[0];
        } 

        const query = "UPDATE overlays SET flipbook_id=?, x=?, y=?, w=?, h=?, url=?, page=? WHERE id=?";
        const [results] = await pool.execute(query,
            [
                fields?.["flipbook_id"] || currOverlay["flipbook_id"],
                fields?.["x"] || currOverlay["x"],
                fields?.["y"] || currOverlay["y"],
                fields?.["w"] || currOverlay["w"],
                fields?.["h"] || currOverlay["h"],
                fields?.["url"] || currOverlay["url"],
                fields?.["page"] || currOverlay["page"],
                overlayId
            ]);

        return results[0];
    },
    delete: async function (id) {
        if (!id) return null;
        const [results] =
            await pool.execute("DELETE FROM overlays where id = ?", [id]);

        if (!results) return null;

        return results;
    }
}
