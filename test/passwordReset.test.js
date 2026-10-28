const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const express = require('express');
const bcrypt = require('bcrypt');

let rows = [];
let sent = [];
let failEmail = false;
let committed = 0;
let rolledBack = 0;
let passwordHash;
let resetCalls = 0;
const user = { id: 'test-user', user_name: 'person@example.com' };
const pool = {
    async execute(sql, args) {
        if (sql.startsWith('SELECT id, user_name')) return [[args[0] === user.user_name ? user : undefined].filter(Boolean)];
        if (sql.startsWith('INSERT')) {
            rows.push({ hash: args[0], user_id: args[1], valid: true });
            return [{}];
        }
        if (sql.startsWith('SELECT user_id')) return [rows.filter(row => row.hash === args[0] && row.valid)];
        if (sql.startsWith('SELECT id FROM users')) return [[user]];
        if (sql.startsWith('UPDATE users')) { passwordHash = args[0]; return [{}]; }
        if (sql.startsWith('DELETE') && sql.includes('token_hash =')) rows = rows.filter(row => row.hash !== args[0]);
        if (sql.startsWith('DELETE') && sql.includes('user_id =')) rows = rows.filter(row => row.user_id !== args[0]);
        return [{}];
    },
    async getConnection() {
        return {
            execute: pool.execute,
            async beginTransaction() {},
            async commit() { committed++; },
            async rollback() { rolledBack++; },
            release() {}
        };
    }
};
require.cache[require.resolve('../data/database')] = { exports: { getPool: () => pool } };
require.cache[require.resolve('../auth/services/passwordResetEmail')] = {
    exports: async (email, token) => {
        if (failEmail) throw new Error('SMTP unavailable');
        sent.push({ email, token });
    }
};
const PasswordReset = require('../auth/data/PasswordReset');
const realReset = PasswordReset.reset;
PasswordReset.reset = async (...args) => { resetCalls++; return realReset(...args); };
const app = express();
app.use(express.json());
app.use('/auth', require('../auth/routes/passwordReset'));
app.post('/auth/refresh', (req, res) => res.json({ message: 'existing route' }));
const server = app.listen(0, '127.0.0.1');
after(() => new Promise(resolve => server.close(resolve)));

async function post(path, body) {
    if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/auth/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    return { status: response.status, headers: response.headers, body: await response.json() };
}

test('reset flow stores a digest, changes the password, and rejects reuse and expiry', async () => {
    await PasswordReset.request('unknown@example.com');
    assert.equal(rows.length, 0);
    await PasswordReset.request(user.user_name);
    const { token } = sent.at(-1);
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.equal(rows[0].hash, createHash('sha256').update(token).digest('hex'));
    assert.notEqual(rows[0].hash, token);
    await PasswordReset.request(user.user_name);
    assert.equal(await PasswordReset.reset(token, 'new-password'), true);
    assert.equal(await bcrypt.compare('new-password', passwordHash), true);
    assert.equal(rows.length, 0, 'all links for the user are invalidated');
    assert.equal(committed, 1);
    assert.equal(await PasswordReset.reset(token, 'other-password'), false);
    await PasswordReset.request(user.user_name);
    rows[0].valid = false;
    assert.equal(await PasswordReset.reset(sent.at(-1).token, 'other-password'), false);
});

test('a token consumed between lookup and transaction is rejected', async () => {
    rows = [];
    await PasswordReset.request(user.user_name);
    const originalGetConnection = pool.getConnection;
    pool.getConnection = async () => {
        rows = [];
        return originalGetConnection();
    };
    try {
        assert.equal(await PasswordReset.reset(sent.at(-1).token, 'new-password'), false);
        assert.equal(rolledBack, 1);
    } finally {
        pool.getConnection = originalGetConnection;
    }
});

test('delivery failures remove the undelivered token', async () => {
    rows = [];
    failEmail = true;
    try {
        await assert.rejects(PasswordReset.request(user.user_name), /SMTP unavailable/);
        assert.equal(rows.length, 0);
    } finally {
        failEmail = false;
    }
});

test('HTTP validation, generic responses, successful reset, and rate limiting', async () => {
    resetCalls = 0;
    assert.equal((await post('forgot-password', {})).status, 400);
    const unknown = await post('forgot-password', { email: 'unknown@example.com' });
    const known = await post('forgot-password', { email: user.user_name });
    assert.equal(known.status, 200);
    assert.deepEqual(known.body, unknown.body);
    assert.equal(known.headers.get('cache-control'), 'no-store');
    assert.equal((await post('reset-password', { token: 'invalid', password: 'new-password' })).status, 400);
    const token = sent.at(-1).token;
    assert.equal((await post('reset-password', { token, password: 'short' })).status, 400);
    assert.equal((await post('reset-password', { token, password: '😀'.repeat(19) })).status, 400);
    assert.equal(resetCalls, 0);
    assert.equal((await post('reset-password', { token, password: 'new-password' })).status, 200);
    assert.equal((await post('reset-password', { token, password: 'new-password' })).status, 400);
    await post('forgot-password', { email: 'unknown@example.com' });
    await post('forgot-password', { email: 'unknown@example.com' });
    const limited = await post('forgot-password', { email: 'unknown@example.com' });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
    assert.equal((await post('refresh', {})).status, 200, 'reset limits must not affect other auth routes');
});
