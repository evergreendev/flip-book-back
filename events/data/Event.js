const db = require('../../data/database');
const {v4: uuidv4} = require('uuid');

const pool = db.getPool();

module.exports = {
    findById: async function (id) {
        const [events] = await pool.execute("SELECT * FROM events where id=?", [id]);

        return events;
    },
    findAll: async function () {
        const [events] = await pool.execute("SELECT * FROM events", []);

        return events;
    },
    create: async function (eventType, flipbookId, pageNumber, sessionId, userId) {
        const eventId = uuidv4();
        const [results] = await pool.execute(
            "INSERT INTO events (id, event_type, flipbook_id, page_number, session_id, user_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)"
            , [eventId, eventType, flipbookId, pageNumber, sessionId, userId, new Date()]);

        if (!results) return null;

        const [newEvent] = await pool.execute("SELECT * FROM events where id=?", [eventId]);

        return newEvent[0];
    },
    /*Move these to their own files*/
/*    createClick: async function (eventId, click_type, href, overlay_id) {
        const [results] = await pool.execute(
            "INSERT INTO click_events (event_id, click_type, href, overlay_id) VALUES (?, ?, ?,?)"
            , [eventId, click_type, href, overlay_id]);

        if (!results) return null;

        const [newEvent] = await pool.execute(
            "SELECT 'event_id','click_type','href','overlay_id' FROM click_events where event_id=?", [eventId]);

        return newEvent[0];
    },
    createRead: async function (eventId, durationSeconds, completed) {
        const [results] = await pool.execute(
            "INSERT INTO read_events (event_id, duration_seconds, completed) VALUES (?, ?, ?)"
            , [eventId, durationSeconds, completed]);

        if (!results) return null;

        const [newEvent] = await pool.execute(
            "SELECT 'event_id','duration_seconds','completed' FROM read_events where event_id=?", [eventId]);

        return newEvent[0];
    }*/
}
