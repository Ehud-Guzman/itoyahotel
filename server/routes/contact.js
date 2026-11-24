const express = require('express')
const { createTransporter } = require('../lib/mailer')
const { LIMITS, isEmail, isPhone, tooLong } = require('../lib/validate')
const store = require('../store')

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

function genContactRef() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ITOYA-CONTACT-${d}-${r}`
}

// Sends the enquiry email to the hotel. Never throws: returns { sent, error }.
async function sendContactEmail(enquiry) {
  let transporter
  try {
    transporter = createTransporter()
  } catch (err) {
    return { sent: false, error: err.message }
  }
  const recipients = (process.env.HOTEL_EMAIL || '').split(',').map((address) => address.trim()).filter(Boolean)
  if (recipients.length === 0) {
    return { sent: false, error: 'HOTEL_EMAIL is not configured.' }
  }
  const enquiryType = ENQUIRY_LABELS[enquiry.type] || 'General Enquiry'
  try {
    await transporter.sendMail({
      from:    `"Hotel Itoya Website" <${process.env.EMAIL_USER}>`,
      to:      recipients,
      replyTo: enquiry.email,
      subject: `New Enquiry — ${enquiryType} — ${enquiry.name.replace(/\s+/g, ' ').trim()}`,
      html: `\n        <h2 style="font-family:serif;color:#a4733c">New Website Enquiry</h2>\n        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">\n          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666;width:120px">Type</td><td style="padding:6px 12px">${escapeHtml(enquiryType)}</td></tr>\n          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Name</td><td style="padding:6px 12px">${escapeHtml(enquiry.name)}</td></tr>\n          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Email</td><td style="padding:6px 12px">${escapeHtml(enquiry.email)}</td></tr>\n          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Phone</td><td style="padding:6px 12px">${escapeHtml(enquiry.phone) || '—'}</td></tr>\n          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Check-in</td><td style="padding:6px 12px">${escapeHtml(enquiry.checkin) || '—'}</td></tr>\n          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Check-out</td><td style="padding:6px 12px">${escapeHtml(enquiry.checkout) || '—'}</td></tr>\n          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Guests</td><td style="padding:6px 12px">${escapeHtml(enquiry.guests) || '—'}</td></tr>\n          <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Message</td><td style="padding:6px 12px">${escapeHtml(enquiry.message)}</td></tr>\n        </table>\n      `,
    })
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err.message }
  }
}

// Sends the email and records the outcome. Never throws — failures are retried
// by runContactEmailRetries rather than lost.
async function notifyContact(record) {
  try {
    const result = await sendContactEmail(record)
    await store.recordContactEmailResult(record.ref, { sent: result.sent, error: result.error })
    if (!result.sent) {
      console.error(`[CONTACT EMAIL FAILED] ${record.ref}: ${result.error}`)
    }
    return result
  } catch (err) {
    console.error(`[CONTACT EMAIL ERROR] ${record.ref}:`, err.message)
    return { sent: false, error: err.message }
  }
}

// Called every minute by the server. Picks up contact enquiries whose email
// never arrived and tries again with exponential backoff.
async function runContactEmailRetries() {
  const refs = await store.findContactEmailsToRetry()
  let retried = 0
  for (const ref of refs) {
    const record = await store.getContactEnquiry(ref)
    if (record) { await notifyContact(record); retried++ }
  }
  return retried
}

// ── POST /api/contact ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, type, checkin, checkout, guests, message, website_url } = req.body

    // Honeypot — a real visitor never sees or fills this field (hidden
    // off-screen in the form). Bots that blindly fill every input trip it.
    // Respond as if it succeeded so the bot doesn't learn to look elsewhere.
    // Named "website_url" so browsers don't autofill it with saved personal/company info.
    if (website_url) {
      return res.json({ ok: true })
    }

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' })
    }
    // Everything below is interpolated into an email the hotel reads, so keep it
    // to plain strings of a sane size (this route is unauthenticated).
    for (const [label, value] of [['Name', name], ['Email', email], ['Message', message]]) {
      if (typeof value !== 'string') return res.status(400).json({ message: `${label} is invalid.` })
    }
    if (tooLong(name, LIMITS.name))       return res.status(400).json({ message: `Name must be ${LIMITS.name} characters or fewer.` })
    if (!isEmail(email))                  return res.status(400).json({ message: 'Please enter a valid email address.' })
    if (tooLong(message, LIMITS.message)) return res.status(400).json({ message: `Message must be ${LIMITS.message} characters or fewer.` })
    if (phone && !isPhone(phone))         return res.status(400).json({ message: 'Please enter a valid phone number.' })
    for (const value of [checkin, checkout, guests, type]) {
      if (value != null && (typeof value !== 'string' || tooLong(value, LIMITS.short))) {
        return res.status(400).json({ message: 'Some of the details you entered are invalid.' })
      }
    }

    const ref = genContactRef()
    const record = {
      ref, name, email, phone: phone || null, type: type || null,
      checkin: checkin || null, checkout: checkout || null,
      guests: guests || null, message,
    }

    // Persist the enquiry so it can be retried if the email never arrives.
    await store.createContactEnquiry(record)

    // Fire-and-forget: never block the guest's response on email delivery.
    // If Brevo is down, the retry job picks it up within a minute.
    notifyContact(record)

    res.json({ ok: true, ref })
  } catch (err) {
    const providerError = err.response?.data?.message || err.message || 'Email delivery failed.'
    console.error('Contact enquiry error:', providerError)
    res.status(500).json({ message: 'Could not send your enquiry. Please try WhatsApp or call us directly.', detail: providerError })
  }
})

module.exports = router
module.exports.notifyContact = notifyContact
module.exports.runContactEmailRetries = runContactEmailRetries
