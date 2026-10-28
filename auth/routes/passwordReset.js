const express = require('express');
const PasswordReset = require('../data/PasswordReset');
const router = express.Router();
const message = 'If an account exists for that email, a password reset link will be sent.';

// Local abuse protection. Use a shared gateway limit when running multiple instances.
const attempts = new Map();
const windowMs = 15 * 60 * 1000;
router.use(['/forgot-password', '/reset-password'], (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const now = Date.now();
    for (const [key, entry] of attempts) {
        if (entry.expires <= now) attempts.delete(key);
    }
    const key = req.socket.remoteAddress;
    const entry = attempts.get(key) || { count: 0, expires: now + windowMs };
    entry.count += 1;
    attempts.set(key, entry);
    if (entry.count > 10) {
        res.set('Retry-After', String(Math.ceil((entry.expires - now) / 1000)));
        return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    next();
});

router.post('/forgot-password', async (req, res) => {
    const email = req.body?.email;
    if (typeof email !== 'string' || email.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'A valid email is required.' });
    }
    try {
        await PasswordReset.request(email.trim());
    } catch {
        // Keep failures generic so this endpoint does not disclose registered emails.
        console.error('Password reset request failed. Check database and SMTP configuration.');
    }
    return res.json({ message });
});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ error: 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.' });
    }
    try {
        if (!await PasswordReset.reset(token, password)) {
            return res.status(400).json({ error: 'Invalid or expired reset link.' });
        }
        return res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
    } catch {
        console.error('Password reset failed. Check database configuration.');
        return res.status(500).json({ error: 'Unable to reset password. Please try again later.' });
    }
});

module.exports = router;
