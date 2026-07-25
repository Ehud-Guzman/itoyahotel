const nodemailer = require('nodemailer')

function createTransporter() {
  const port = Number(process.env.EMAIL_PORT) || 587
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    // Port 465 is implicit TLS from the first byte of the connection;
    // 587 (Gmail's default, and what this was hardcoded for) upgrades to
    // TLS via STARTTLS instead. cPanel-hosted mailboxes commonly expect
    // 465 — getting `secure` wrong for the provider's port silently
    // breaks the SMTP handshake, so derive it from the port unless
    // EMAIL_SECURE explicitly overrides it.
    secure: process.env.EMAIL_SECURE
      ? process.env.EMAIL_SECURE === 'true'
      : port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

module.exports = { createTransporter }
