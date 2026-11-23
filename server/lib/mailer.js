const axios = require('axios')

const API_URL = 'https://api.brevo.com/v3/smtp/email'

function sender() {
  const email = process.env.EMAIL_USER
  if (!email) throw new Error('EMAIL_USER must be set to a verified Brevo sender address.')
  return { name: 'Hotel Itoya', email }
}

function recipients(value) {
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item || '').split(','))
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email }))
}

function createTransporter() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY is not configured.')

  return {
    async verify() {
      // Validate credentials without sending an email.
      await axios.get('https://api.brevo.com/v3/account', {
        headers: { 'api-key': apiKey },
        timeout: 10_000,
      })
    },

    async sendMail(message) {
      const from = typeof message.from === 'string'
        ? (message.from.match(/<([^>]+)>/)?.[1] || process.env.EMAIL_USER)
        : (message.from?.email || process.env.EMAIL_USER)
      const payload = {
        sender: { ...sender(), email: from },
        to: recipients(message.to),
        subject: message.subject,
        htmlContent: message.html,
      }
      if (message.replyTo) payload.replyTo = { email: message.replyTo }
      if (message.attachments?.length) {
        payload.attachment = message.attachments.map((attachment) => ({
          name: attachment.filename,
          content: Buffer.from(attachment.content).toString('base64'),
        }))
      }

      const response = await axios.post(API_URL, payload, {
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        timeout: 20_000,
      })
      return { messageId: response.data?.messageId }
    },
  }
}

module.exports = { createTransporter }
