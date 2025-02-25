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
    update: async function (overlayId, fields) {
        //todo implement update
    },
    delete: async function (id) {
        if (!id) return null;
        const [results] =
            await pool.execute("DELETE FROM overlays where id = ?", [id]);

        if (!results) return null;

        return results;
    }
}
