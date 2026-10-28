const { randomBytes, createHash } = require('node:crypto');
const bcrypt = require('bcrypt');
const pool = require('../../data/database').getPool();
const sendEmail = require('../services/passwordResetEmail');

function digest(token) {
    return createHash('sha256').update(token).digest('hex');
}

module.exports = {
    async request(email) {
        const [users] = await pool.execute('SELECT id, user_name FROM users WHERE user_name = ? LIMIT 1', [email]);
        if (!users.length) return;

        const token = randomBytes(32).toString('hex');
        const tokenHash = digest(token);
        await pool.execute('DELETE FROM password_reset_tokens WHERE expires_at <= UTC_TIMESTAMP()', []);
        await pool.execute(
            'INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))',
            [tokenHash, users[0].id]
        );
        try {
            await sendEmail(users[0].user_name, token);
        } catch (error) {
            await pool.execute('DELETE FROM password_reset_tokens WHERE token_hash = ?', [tokenHash]);
            throw error;
        }
    },

    async reset(token, password) {
        const tokenHash = digest(token);
        const [tokens] = await pool.execute(
            'SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP()', [tokenHash]
        );
        if (!tokens.length) return false;
        const passwordHash = await bcrypt.hash(password, 10);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            // Serialize resets for this user before checking the token again.
            const [users] = await connection.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [tokens[0].user_id]);
            const [validTokens] = await connection.execute(
                'SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP() FOR UPDATE', [tokenHash]
            );
            if (!users.length || !validTokens.length) {
                await connection.rollback();
                return false;
            }
            await connection.execute('UPDATE users SET password = ? WHERE id = ?', [passwordHash, users[0].id]);
            await connection.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [users[0].id]);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};
