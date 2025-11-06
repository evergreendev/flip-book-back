const db = require('../../data/database');
const {v4: uuidv4} = require('uuid');

const pool = db.getPool();

module.exports = {
    findById: async function (id) {
        const [rows] = await pool.execute("SELECT * FROM read_sessions WHERE id = ?", [id]);
        return rows;
    },

    // Returns all read event rows
    findAll: async function () {
        const [rows] = await pool.execute("SELECT * FROM read_sessions", []);
        return rows;
    },

    // Creates a read_event tied to an existing event id
    create: async function (sessionId) {
        const id = uuidv4();
        const [results] = await pool.execute(
            "INSERT INTO flipbook.read_sessions (id, session_id, started_at, last_seen ,state) VALUES (?, ?, ?, ?, ?)",
            [id, sessionId, new Date(), new Date(), "active"]
        );

        if (!results) return null;

        const [newRows] = await pool.execute(
            "SELECT * FROM read_sessions WHERE id = ?",
            [id]
        );

        // If multiple rows exist with same event_id, return the most recent one
        return newRows && newRows.length ? newRows[newRows.length - 1] : null;
    },

    heartbeat: async function (id, updateLastSeen) {
        if (updateLastSeen) {
            await pool.execute(
                "UPDATE read_sessions SET last_seen = ? WHERE id = ?", [new Date(), id]);
        }

        const [results] = await pool.execute("SELECT id, state, ended_at, started_at, last_seen, closed_reason FROM read_sessions WHERE id = ?", [id]);

        if (!results) return null;

        return results[0];
    }
}
