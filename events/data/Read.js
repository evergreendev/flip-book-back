const db = require('../../data/database');

const pool = db.getPool();

module.exports = {
    findById: async function (eventId) {
        const [rows] = await pool.execute("SELECT * FROM read_events WHERE event_id = ?", [eventId]);
        return rows;
    },

    findByFlipbookId: async function (flipbookId) {
        const [rows] = await pool.execute(
            `SELECT re.*, rs.*, e.*
             FROM read_events re
                      JOIN read_sessions rs ON re.read_session_id = rs.id
                      JOIN events e ON re.event_id = e.id
             WHERE e.flipbook_id = ?`,
            [flipbookId]
        );

        return Object.groupBy(rows, row => row["read_session_id"]);
    },

    // Returns all read event rows
    findAll: async function () {
        const [rows] = await pool.execute("SELECT * FROM read_events", []);
        return rows;
    },

    // Creates a read_event tied to an existing event id
    create: async function (eventId, readSession, idempotencyKey, ms, seq, ts_ms) {


        const [results] = await pool.execute(
            `INSERT INTO read_events (event_id, completed, read_session_id, idempotency_key, ms, seq, ts_ms,
                                      received_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE idempotency_key = idempotency_key`,
            [eventId, 1, readSession, idempotencyKey, ms, seq, ts_ms]
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
