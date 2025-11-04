const db = require('../../data/database');

const pool = db.getPool();

module.exports = {
    // Returns the impression event row(s) for a given event_id
    findById: async function (eventId) {
        const [rows] = await pool.execute("SELECT * FROM click_events WHERE event_id = ?", [eventId]);
        return rows;
    },

    // Returns all impression event rows
    findAll: async function () {
        const [rows] = await pool.execute("SELECT * FROM click_events", []);
        return rows;
    },

    // Creates an impression_event tied to an existing event id
    create: async function (eventId, clickType, overlayId, href) {
        const [results] = await pool.execute(
            "INSERT INTO click_events (event_id, click_type, href, overlay_id) VALUES (?, ?, ?, ?)",
            [eventId, clickType, href, overlayId]
        );

        if (!results) return null;

        const [newRows] = await pool.execute(
            "SELECT * FROM click_events WHERE event_id = ?",
            [eventId]
        );

        // If multiple rows exist with same event_id, return the most recent one
        return newRows && newRows.length ? newRows[newRows.length - 1] : null;
    }
}
