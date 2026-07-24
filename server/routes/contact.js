const express = require('express')
const { createTransporter } = require('../lib/mailer')

const router = express.Router()

// Guest-supplied fields are interpolated straight into the HTML email body
// below — without escaping, a message like `<a href="evil">click</a>`
// would render as a live link inside the hotel's inbox.
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

const ENQUIRY_LABELS = {
  accommodation: 'Accommodation',
  conference:    'Conference & Meetings',
  events:        'Events & Occasions',
  corporate:     'Corporate Booking',
  dining:        'Dining Reservation',
  other:         'General Enquiry',
}

// ── POST /api/contact ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, type, checkin, checkout, guests, message, company } = req.body

    // Honeypot — a real visitor never sees or fills this field (hidden
    // off-screen in the form). Bots that blindly fill every input trip it.
    // Respond as if it succeeded so the bot doesn't learn to look elsewhere.
    if (company) {
      return res.json({ ok: true })
    }

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' })
    }

    const transporter = createTransporter()
    const enquiryType  = ENQUIRY_LABELS[type] || 'General Enquiry'

    await transporter.sendMail({
      from:    `"Hotel Itoya Website" <${process.env.EMAIL_USER}>`,
      to:      process.env.HOTEL_EMAIL,
      replyTo: email,
      subject: `New Enquiry — ${enquiryType} — ${name}`,
      html: `
        <h2 style="font-family:serif;color:#a4733c">New Website Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666;width:120px">Type</td><td style="padding:6px 12px">${escapeHtml(enquiryType)}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Name</td><td style="padding:6px 12px">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Email</td><td style="padding:6px 12px">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Phone</td><td style="padding:6px 12px">${escapeHtml(phone) || '—'}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Check-in</td><td style="padding:6px 12px">${escapeHtml(checkin) || '—'}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Check-out</td><td style="padding:6px 12px">${escapeHtml(checkout) || '—'}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Guests</td><td style="padding:6px 12px">${escapeHtml(guests) || '—'}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Message</td><td style="padding:6px 12px">${escapeHtml(message)}</td></tr>
        </table>
      `,
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('Contact enquiry error:', err)
    res.status(500).json({ message: 'Could not send your enquiry. Please try WhatsApp or call us directly.' })
  }
})

module.exports = router
