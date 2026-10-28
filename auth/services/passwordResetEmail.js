const nodemailer = require('nodemailer');

module.exports = async function sendPasswordResetEmail(email, token) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, PASSWORD_RESET_URL } = process.env;
    if (!SMTP_HOST || !MAIL_FROM || !PASSWORD_RESET_URL || (!!SMTP_USER !== !!SMTP_PASS)) {
        throw new Error('Password reset email is not configured');
    }

    const url = new URL(PASSWORD_RESET_URL);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid PASSWORD_RESET_URL');
    url.searchParams.set('token', token);

    const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: Number(SMTP_PORT || 587) === 465,
        requireTLS: Number(SMTP_PORT || 587) !== 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });

    await transport.sendMail({
        from: MAIL_FROM,
        to: email,
        subject: 'Reset your password',
        text: `To reset your password, open this link:\n\n${url.toString()}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.`
    });
};
