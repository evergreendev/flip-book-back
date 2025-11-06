const db = require('../../data/database');

const pool = db.getPool();

module.exports = {
    findById: async function (eventId) {
        const [rows] = await pool.execute("SELECT * FROM read_events WHERE event_id = ?", [eventId]);
        return rows;
    },

    // Returns all read event rows
    findAll: async function () {
        const [rows] = await pool.execute("SELECT * FROM read_events", []);
        return rows;
    },

    // Creates a read_event tied to an existing event id
    create: async function (eventId, duration, readSessionId) {
        const [results] = await pool.execute(
            "INSERT INTO flipbook.read_events (event_id, duration, completed, read_session_id) VALUES (?, ?, ?, ?)",
            [eventId, duration, false, readSessionId]
        );

        if (!results) return null;

        const [newRows] = await pool.execute(
            "SELECT * FROM read_events WHERE event_id = ?",
            [eventId]
        );

        // If multiple rows exist with same event_id, return the most recent one
        return newRows && newRows.length ? newRows[newRows.length - 1] : null;
    }
}
