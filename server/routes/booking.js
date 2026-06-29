const express = require('express')
const multer  = require('multer')
const axios   = require('axios')
const { Resend } = require('resend')

const router  = express.Router()
const upload  = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    cb(null, ok.includes(file.mimetype))
  },
})

// In-memory store: ref → booking record
// Fine for this hotel's volume; replace with Redis/DB if needed later.
const bookings = new Map()

// ── Generate booking reference ────────────────────────────────────────────────
function genRef() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ITOYA-${d}-${r}`
}

// ── M-Pesa STK Push ───────────────────────────────────────────────────────────
async function getAccessToken() {
  const { MPESA_CONSUMER_KEY: key, MPESA_CONSUMER_SECRET: secret, MPESA_ENV } = process.env
  const base = MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
  const res = await axios.get(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    auth: { username: key, password: secret },
  })
  return res.data.access_token
}

async function initiateSTKPush({ phone, amount, ref }) {
  const { MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL, MPESA_ENV } = process.env
  const base      = MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
  const password  = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64')
  const token     = await getAccessToken()

  const res = await axios.post(
    `${base}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: MPESA_SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            Math.ceil(amount),
      PartyA:            phone,
      PartyB:            MPESA_SHORTCODE,
      PhoneNumber:       phone,
      CallBackURL:       MPESA_CALLBACK_URL,
      AccountReference:  ref,
      TransactionDesc:   `Hotel Itoya booking ${ref}`,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return res.data.CheckoutRequestID
}

// ── Email helper ──────────────────────────────────────────────────────────────
async function sendEmails(booking) {
  const resend      = new Resend(process.env.RESEND_API_KEY)
  const from        = process.env.EMAIL_FROM
  const hotelEmail  = process.env.HOTEL_EMAIL
  const { b, idFrontBuffer, idBackBuffer, idFrontName, idBackName } = booking

  const summary = `
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666;width:120px">Reference</td><td style="padding:6px 12px;font-weight:600">${b.ref}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Room</td><td style="padding:6px 12px">${b.roomLabel}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Check-in</td><td style="padding:6px 12px">${b.checkIn}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Check-out</td><td style="padding:6px 12px">${b.checkOut}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Nights</td><td style="padding:6px 12px">${b.nights}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Guests</td><td style="padding:6px 12px">${b.guests}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Name</td><td style="padding:6px 12px">${b.name}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Phone</td><td style="padding:6px 12px">${b.phone}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Email</td><td style="padding:6px 12px">${b.email}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">M-Pesa Ref</td><td style="padding:6px 12px">${b.mpesaRef || '—'}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Amount Paid</td><td style="padding:6px 12px;font-weight:600">KES ${Number(b.amount).toLocaleString()}</td></tr>
      ${b.requests ? `<tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Requests</td><td style="padding:6px 12px">${b.requests}</td></tr>` : ''}
    </table>
  `

  // ── Hotel notification (with ID attachments) ──
  await resend.emails.send({
    from,
    to:      hotelEmail,
    subject: `New Booking ${b.ref} — ${b.name} (${b.checkIn} → ${b.checkOut})`,
    html: `
      <h2 style="font-family:serif;color:#a4733c">New Confirmed Booking</h2>
      <p style="font-family:sans-serif;font-size:14px;color:#555">
        A guest has completed payment and submitted a booking request.
        Please review the details below and confirm via email to the guest.
      </p>
      ${summary}
      <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:24px">
        Guest ID documents are attached to this email.
      </p>
    `,
    attachments: [
      { filename: `ID-front-${b.name}.${idFrontName.split('.').pop()}`, content: idFrontBuffer },
      { filename: `ID-back-${b.name}.${idBackName.split('.').pop()}`,  content: idBackBuffer  },
    ],
  })

  // ── Guest confirmation ──
  await resend.emails.send({
    from,
    to:      b.email,
    subject: `Your Booking at Hotel Itoya — ${b.ref}`,
    html: `
      <h2 style="font-family:serif;color:#a4733c">Booking Received — Hotel Itoya</h2>
      <p style="font-family:sans-serif;font-size:14px;color:#555">
        Dear ${b.name},<br><br>
        Thank you for choosing Hotel Itoya. Your payment has been received and your
        booking is under review. A member of our team will contact you within a few hours
        to confirm your reservation.
      </p>
      ${summary}
      <p style="font-family:sans-serif;font-size:14px;color:#555;margin-top:24px">
        If you have any questions, please call us on
        <strong>+254 714 302 777</strong> or email
        <a href="mailto:hotel.itoya@ayotigroup.com">hotel.itoya@ayotigroup.com</a>.
      </p>
      <p style="font-family:sans-serif;font-size:12px;color:#aaa;margin-top:32px">
        Hotel Itoya · B1 Kisumu-Busia Road, Busia, Kenya
      </p>
    `,
  })
}

// ── POST /api/booking/initiate ────────────────────────────────────────────────
router.post(
  '/initiate',
  upload.fields([{ name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }]),
  async (req, res) => {
    try {
      const {
        room, roomLabel, checkIn, checkOut, nights,
        guests, name, phone, email, requests, mpesaPhone, amount,
      } = req.body

      if (!name || !phone || !email || !room || !checkIn || !checkOut) {
        return res.status(400).json({ message: 'Missing required fields' })
      }
      if (!req.files?.idFront || !req.files?.idBack) {
        return res.status(400).json({ message: 'ID documents are required' })
      }

      const ref         = genRef()
      const idFrontFile = req.files.idFront[0]
      const idBackFile  = req.files.idBack[0]

      const record = {
        b: {
          ref, room, roomLabel, checkIn, checkOut, nights,
          guests, name, phone, email, requests, mpesaPhone, amount,
          mpesaRef: null,
        },
        idFrontBuffer: idFrontFile.buffer,
        idBackBuffer:  idBackFile.buffer,
        idFrontName:   idFrontFile.originalname,
        idBackName:    idBackFile.originalname,
        status:        'pending',
        checkoutRequestId: null,
      }
      bookings.set(ref, record)

      // ── Try real M-Pesa STK Push ──────────────────────────────────────────
      const isPlaceholder = !process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'YOUR_CONSUMER_KEY'

      if (!isPlaceholder) {
        try {
          const ckId = await initiateSTKPush({ phone: mpesaPhone, amount, ref })
          record.checkoutRequestId = ckId
        } catch (err) {
          console.error('STK Push failed:', err.response?.data || err.message)
          bookings.delete(ref)
          return res.status(502).json({ message: 'Could not initiate M-Pesa payment. Please try again.' })
        }
      } else {
        // ── Placeholder mode: auto-succeed after 12 seconds ──────────────────
        console.log(`[PLACEHOLDER] Booking ${ref} — auto-confirming in 12s`)
        setTimeout(async () => {
          const r = bookings.get(ref)
          if (!r || r.status !== 'pending') return
          r.status = 'success'
          try { await sendEmails(r) } catch (e) { console.error('Email error:', e.message) }
        }, 12_000)
      }

      res.json({ ref })
    } catch (err) {
      console.error('Booking initiate error:', err)
      res.status(500).json({ message: 'Server error. Please try again.' })
    }
  },
)

// ── GET /api/booking/status/:ref ──────────────────────────────────────────────
router.get('/status/:ref', (req, res) => {
  const record = bookings.get(req.params.ref)
  if (!record) return res.status(404).json({ status: 'not_found' })
  res.json({ status: record.status })
})

// Export map so the mpesa callback route can update statuses
module.exports = router
module.exports.bookings  = bookings
module.exports.sendEmails = sendEmails
