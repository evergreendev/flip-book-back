const db = require('../../data/database');

const pool = db.getPool();

module.exports = {
    // Returns the impression event row(s) for a given event_id
    findById: async function (eventId) {
        const [rows] = await pool.execute("SELECT * FROM impression_events WHERE event_id = ?", [eventId]);
        return rows;
    },

    findByFlipbookId: async function (flipbookId, impressionType) {
        const [rows] = await pool.execute(
            `SELECT ie.*, e.*
             FROM impression_events ie
                      JOIN events e ON ie.event_id = e.id
             WHERE e.flipbook_id = ? ${impressionType ? 'AND e.type = ?' : ''}`,
            impressionType ? [flipbookId, impressionType] : [flipbookId]
        );

        return rows;
    },

    // Returns all impression event rows
    findAll: async function () {
        const [rows] = await pool.execute("SELECT * FROM impression_events", []);
        return rows;
    },

    // Creates an impression_event tied to an existing event id
    create: async function (eventId, impressionType, overlayId) {
        const [results] = await pool.execute(
            "INSERT INTO impression_events (event_id, impression_type, overlay_id) VALUES (?, ?, ?)",
            [eventId, impressionType, overlayId]
        );

        if (!results) return null;

        const [newRows] = await pool.execute(
            "SELECT event_id, impression_type, overlay_id FROM impression_events WHERE event_id = ?",
            [eventId]
        );

        // If multiple rows exist with same event_id, return the most recent one
        return newRows && newRows.length ? newRows[newRows.length - 1] : null;
    }
}
