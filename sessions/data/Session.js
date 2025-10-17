const bcrypt = require('bcrypt');
const db = require('../../data/database');
const {v4: uuidv4} = require('uuid');

const pool = db.getPool();

module.exports = {
    /*    findById: async function (id) {
            const [sessions] = await pool.execute("SELECT 'id','session_name' FROM sessions where id=?", [id]);

            return sessions;
        },*/
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
    }
}
