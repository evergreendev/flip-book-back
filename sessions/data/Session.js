const db = require('../../data/database');
const {v4: uuidv4} = require('uuid');

const pool = db.getPool();

module.exports = {
    findById: async function (id) {
        const [sessions] = await pool.execute("SELECT id, state FROM sessions where id=?", [id]);

        return sessions;
    },
    cronEndSessions: async function () {
        const [results] = await pool.execute(
            "UPDATE sessions SET ended_at = NOW(), state = 'ended', closed_reason = 'cron' WHERE ended_at IS NULL AND last_seen > DATE_SUB(NOW(), INTERVAL 15 MINUTE) OR ended_at IS NULL"
            , [new Date()]);

        await pool.execute("UPDATE read_sessions SET ended_at = NOW(), state = 'ended', closed_reason = 'cron' WHERE ended_at IS NULL AND last_seen > DATE_SUB(NOW(), INTERVAL 15 MINUTE) OR ended_at IS NULL"
            , [new Date()]);
    },
    findAll: async function () {
        const [sessions] = await pool.execute("SELECT 'id','user_id', 'ip_address', 'user_agent', 'referrer', 'started_at', 'ended_at' FROM sessions", []);

        return sessions;
    },
    create: async function (ipAddress, userAgent, referrer) {
        const sessionId = uuidv4();
        const [results] = await pool.execute(
            "INSERT INTO sessions (id, user_id, ip_address, user_agent, referrer, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
            , [sessionId, null, ipAddress, userAgent, referrer, new Date(), null]);

        if (!results) return null;

        const [newSession] = await pool.execute("SELECT id, user_id, ip_address, user_agent, referrer, started_at, ended_at FROM sessions WHERE id = ?", [sessionId]);

        return newSession[0];
    },
    heartbeat: async function (sessionId, updateLastSeen) {
        if (updateLastSeen) {
            await pool.execute(
                "UPDATE sessions SET last_seen = ? WHERE id = ?", [new Date(), sessionId]);
        }

        const [results] = await pool.execute("SELECT id, user_id, state, ended_at, started_at, last_seen, closed_reason FROM sessions WHERE id = ?", [sessionId]);

        if (!results) return null;

        return results[0];
    }
}
