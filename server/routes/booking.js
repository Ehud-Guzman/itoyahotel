const express    = require('express')
const multer     = require('multer')
const axios      = require('axios')
const rateLimit  = require('express-rate-limit')
const store      = require('../store')
const { createTransporter } = require('../lib/mailer')
const { ROOM_CATALOG } = require('../roomCatalog')

const router  = express.Router()

// Each of these routes can trigger a real M-Pesa STK push to whatever phone
// number is submitted — unthrottled, that's a ready-made way to spam a
// stranger's phone with payment prompts and burn the hotel's Daraja quota.
// /status/:ref is deliberately excluded: the client polls it every 3s for
// up to 3 minutes per booking, which this limit would break.
const stkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many booking attempts from this device. Please wait a few minutes and try again.' },
})

// /status/:ref is unauthenticated and takes no secret beyond the ref itself
// (4 base36 chars per day — ~1.7M combinations, brute-forceable). Left
// unthrottled, it's also a way to burn the hotel's Daraja API quota: any
// ref that happens to be 'pending' with a checkoutRequestId makes this
// route call out to Safaricom (getAccessToken + stkpushquery) on every
// single hit. The legitimate case (one guest's own booking) polls every 3s
// for up to 3 minutes — about 60 requests — so this is sized generously
// above that per client, not tuned to the bare minimum.
const statusLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'rate_limited' },
})

// multer buffers each upload fully in memory (Postgres BYTEA storage and
// email attachments both need the whole file as a Buffer, not a stream) —
// on Render's free/starter tier that's a small, shared RAM budget, and
// stkLimiter's 8-per-15min cap is per-IP, so it doesn't bound how many
// *different* IPs can upload concurrently. Two levers keep worst-case
// memory bounded: a lower per-file cap, and limitConcurrentUploads below
// capping how many upload requests can be mid-flight at once, checked
// before multer even starts buffering the multipart body.
const MAX_FILE_SIZE_BYTES     = 6 * 1024 * 1024
const MAX_CONCURRENT_UPLOADS  = 15

const upload  = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    cb(null, ok.includes(file.mimetype))
  },
})

let activeUploads = 0
function limitConcurrentUploads(req, res, next) {
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    return res.status(503).json({
      message: 'The booking system is busy right now. Please wait a moment and try again.',
    })
  }
  activeUploads++
  const release = () => { activeUploads = Math.max(0, activeUploads - 1) }
  res.on('finish', release)
  res.on('close', release)
  next()
}

// Wraps upload.fields() so a rejected file (too large, wrong type — e.g. a
// direct API call bypassing the frontend's own pre-upload size check)
// produces our normal { message, step, field } shape instead of an
// unhandled MulterError reaching Express's default error page.
function handleIdUploads(req, res, next) {
  upload.fields([{ name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }])(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, 400, `Each ID file must be under ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`, 2, 'idFront')
    }
    console.error('Upload error:', err.message)
    return fail(res, 400, 'Could not process your uploaded ID files — please use a JPG, PNG, or PDF under 6MB.', 2, 'idFront')
  })
}

// ── Generate booking reference ────────────────────────────────────────────────
function genRef() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ITOYA-${d}-${r}`
}

// Guest-supplied text (name, requests, etc.) is interpolated straight into
// HTML email bodies below — without escaping, a booking named e.g.
// `<a href="evil">click</a>` would render as a live link inside the
// hotel's inbox and the guest's own confirmation email.
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

// ROOM_CATALOG is a plain object keyed by guest-supplied `room`. A plain
// `obj[key]` lookup resolves inherited properties too, so `room` values
// like `__proto__`, `constructor`, or `toString` return a truthy
// non-catalog value (Object.prototype, the constructor function, etc.)
// instead of undefined — bypassing the `!catalogEntry` check below and
// producing a NaN booking amount rather than a clean validation error.
function lookupRoom(id) {
  return Object.prototype.hasOwnProperty.call(ROOM_CATALOG, id) ? ROOM_CATALOG[id] : undefined
}

// fetchWithRetry on the client can legitimately retry a request whose
// response was lost in transit (e.g. a Render cold-start 502 returned by
// the proxy after the app already finished the work) even though the
// server already completed it. Without this, a retried /initiate would
// create a second booking record, and a retried /retry would fire a
// second M-Pesa STK push for the same booking — a real double-charge
// risk. Keyed on a client-generated id that stays identical across
// fetchWithRetry's automatic retries of one logical submission (it's part
// of the same request body/FormData, not regenerated per attempt).
const recentRequests = new Map()  // clientRequestId -> { promise, expiresAt }
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000

function withIdempotency(clientRequestId, fn) {
  if (!clientRequestId) return fn()
  const now = Date.now()
  for (const [key, entry] of recentRequests) {
    if (entry.expiresAt < now) recentRequests.delete(key)
  }
  const existing = recentRequests.get(clientRequestId)
  if (existing) return existing.promise
  // A failure is cached too, deliberately — a duplicate call for the same
  // clientRequestId means fetchWithRetry auto-retried the same submission,
  // and replaying "STK push already failed" is safer than re-attempting a
  // real Safaricom charge a second time. A genuinely new attempt (the
  // guest clicking "Try Again") sends a fresh clientRequestId instead.
  const promise = fn()
  recentRequests.set(clientRequestId, { promise, expiresAt: now + IDEMPOTENCY_TTL_MS })
  return promise
}

// Real payment collection requires both a production Daraja app AND
// MPESA_ENV explicitly set to 'production' — sandbox credentials can push
// an STK prompt, but only to phone numbers Safaricom has pre-whitelisted
// for testing, so they can't be used to actually charge a real guest.
// Until both are true, bookings fall back to reserve-now/pay-at-hotel.
// Flipping MPESA_ENV + real credentials in Render switches this back to
// live STK push with no code changes.
function mpesaIsLive() {
  const { MPESA_ENV, MPESA_CONSUMER_KEY } = process.env
  return MPESA_ENV === 'production' && Boolean(MPESA_CONSUMER_KEY) && MPESA_CONSUMER_KEY !== 'YOUR_CONSUMER_KEY'
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

async function queryStkStatus({ checkoutRequestId }) {
  const { MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_ENV } = process.env
  const base      = MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
  const password  = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64')
  const token     = await getAccessToken()

  const res = await axios.post(
    `${base}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: MPESA_SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return res.data
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
// `paid` distinguishes a real completed M-Pesa payment from a reservation
// made while live payment collection isn't configured (see mpesaIsLive) —
// the wording must never claim a payment happened when none was collected.
async function sendEmails(booking, { paid = true } = {}) {
  const transporter = createTransporter()
  const from        = `"Hotel Itoya Bookings" <${process.env.EMAIL_USER}>`
  const hotelEmail  = process.env.HOTEL_EMAIL
  const { b, idFrontBuffer, idBackBuffer, idFrontName, idBackName } = booking

  const summary = `
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666;width:120px">Reference</td><td style="padding:6px 12px;font-weight:600">${escapeHtml(b.ref)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Room</td><td style="padding:6px 12px">${escapeHtml(b.roomLabel)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Check-in</td><td style="padding:6px 12px">${escapeHtml(b.checkIn)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Check-out</td><td style="padding:6px 12px">${escapeHtml(b.checkOut)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Nights</td><td style="padding:6px 12px">${escapeHtml(b.nights)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Guests</td><td style="padding:6px 12px">${escapeHtml(b.guests)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Name</td><td style="padding:6px 12px">${escapeHtml(b.name)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Phone</td><td style="padding:6px 12px">${escapeHtml(b.phone)}</td></tr>
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Email</td><td style="padding:6px 12px">${escapeHtml(b.email)}</td></tr>
      ${paid ? `<tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">M-Pesa Ref</td><td style="padding:6px 12px">${escapeHtml(b.mpesaRef) || '—'}</td></tr>` : ''}
      <tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">${paid ? 'Amount Paid' : 'Amount Due'}</td><td style="padding:6px 12px;font-weight:600">KES ${Number(b.amount).toLocaleString()}${paid ? '' : ' — pay at hotel'}</td></tr>
      ${b.requests ? `<tr><td style="padding:6px 12px;background:#f9f5ef;color:#666">Requests</td><td style="padding:6px 12px">${escapeHtml(b.requests)}</td></tr>` : ''}
    </table>
  `

  // ── Hotel notification (with ID attachments) ──
  await transporter.sendMail({
    from,
    to:      hotelEmail,
    subject: `${paid ? 'New Booking' : 'New Reservation Request'} ${b.ref} — ${b.name} (${b.checkIn} → ${b.checkOut})`,
    html: `
      <h2 style="font-family:serif;color:#a4733c">${paid ? 'New Confirmed Booking' : 'New Reservation Request — Payment Not Yet Collected'}</h2>
      <p style="font-family:sans-serif;font-size:14px;color:#555">
        ${paid
          ? 'A guest has completed payment and submitted a booking request. Please review the details below and confirm via email to the guest.'
          : 'A guest has requested a reservation. <strong>No online payment was collected</strong> — the guest will pay at the hotel on arrival (cash or M-Pesa). Please review the details below and confirm via email or phone.'}
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
  await transporter.sendMail({
    from,
    to:      b.email,
    subject: `Your ${paid ? 'Booking' : 'Reservation'} at Hotel Itoya — ${b.ref}`,
    html: `
      <h2 style="font-family:serif;color:#a4733c">${paid ? 'Booking Received' : 'Reservation Received'} — Hotel Itoya</h2>
      <p style="font-family:sans-serif;font-size:14px;color:#555">
        Dear ${escapeHtml(b.name)},<br><br>
        ${paid
          ? 'Thank you for choosing Hotel Itoya. Your payment has been received and your booking is under review. A member of our team will contact you within a few hours to confirm your reservation.'
          : `Thank you for choosing Hotel Itoya. We've received your reservation request. Payment of <strong>KES ${Number(b.amount).toLocaleString()}</strong> is due at the hotel during check-in (cash or M-Pesa). A member of our team will contact you within a few hours to confirm your reservation.`}
      </p>
      ${summary}
      <p style="font-family:sans-serif;font-size:14px;color:#555;margin-top:24px">
        If you have any questions, please call us on
        <strong>+254 714 302 777 · +254 714 666 222 · +254 714 777 333</strong> or email
        <a href="mailto:hotel.itoya@ayotigroup.com">hotel.itoya@ayotigroup.com</a>.
      </p>
      <p style="font-family:sans-serif;font-size:12px;color:#aaa;margin-top:32px">
        Hotel Itoya · B1 Kisumu-Busia Road, Busia, Kenya
      </p>
    `,
  })
}

// Maps a validation failure to the modal step/field it belongs to, so the
// client can route the guest back to the right screen instead of dumping
// every error onto the payment step.
function fail(res, status, message, step, field) {
  return res.status(status).json({ message, step, field })
}

// ── GET /api/booking/config ───────────────────────────────────────────────────
// Tells the client whether to run the live M-Pesa payment flow or the
// reserve-now/pay-at-hotel fallback, so it can render step 4 correctly
// before the guest ever submits anything.
router.get('/config', (req, res) => {
  res.json({ live: mpesaIsLive() })
})

// ── POST /api/booking/initiate ────────────────────────────────────────────────
router.post(
  '/initiate',
  stkLimiter,
  limitConcurrentUploads,
  handleIdUploads,
  async (req, res) => {
    try {
      const {
        room, checkIn, checkOut,
        guests, name, phone, email, requests, mpesaPhone, clientRequestId,
      } = req.body

      if (!room)     return fail(res, 400, 'Please select a room type.', 0, 'room')
      if (!checkIn)  return fail(res, 400, 'Select a check-in date.', 0, 'checkIn')
      if (!checkOut) return fail(res, 400, 'Select a check-out date.', 0, 'checkOut')
      if (!name)     return fail(res, 400, 'Full name is required.', 1, 'name')
      if (!phone)    return fail(res, 400, 'Phone number is required.', 1, 'phone')
      if (!email)    return fail(res, 400, 'Email is required.', 1, 'email')
      if (!req.files?.idFront)
        return fail(res, 400, 'The front of your ID could not be uploaded — please use a JPG, PNG, or PDF file.', 2, 'idFront')
      if (!req.files?.idBack)
        return fail(res, 400, 'The back of your ID could not be uploaded — please use a JPG, PNG, or PDF file.', 2, 'idBack')

      // ── Server-side price authority — never trust client-sent amount/nights ──
      const catalogEntry = lookupRoom(room)
      if (!catalogEntry) {
        return fail(res, 400, 'Unknown room type.', 0, 'room')
      }
      const checkInDate  = new Date(`${checkIn}T00:00:00Z`)
      const checkOutDate = new Date(`${checkOut}T00:00:00Z`)
      const nights = Math.round((checkOutDate - checkInDate) / 86_400_000)
      if (!(nights > 0)) {
        return fail(res, 400, 'Check-out must be after check-in.', 0, 'checkOut')
      }
      const todayUTC = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
      if (checkInDate < todayUTC) {
        return fail(res, 400, 'Check-in date cannot be in the past.', 0, 'checkIn')
      }
      const guestsNum = Number(guests)
      if (!Number.isInteger(guestsNum) || guestsNum < 1) {
        return fail(res, 400, 'Enter a valid number of guests.', 0, 'guests')
      }
      if (catalogEntry.maxGuests && guestsNum > catalogEntry.maxGuests) {
        return fail(res, 400, `${catalogEntry.label} fits up to ${catalogEntry.maxGuests} guests.`, 0, 'guests')
      }
      const amount = catalogEntry.price * nights

      const idFrontFile = req.files.idFront[0]
      const idBackFile  = req.files.idBack[0]

      const { status, body } = await withIdempotency(clientRequestId, async () => {
        const ref = genRef()
        const record = {
          b: {
            ref, room, roomLabel: catalogEntry.label, checkIn, checkOut, nights,
            guests: guestsNum, name, phone, email, requests, mpesaPhone, amount,
            mpesaRef: null,
          },
          idFrontBuffer: idFrontFile.buffer,
          idBackBuffer:  idBackFile.buffer,
          idFrontName:   idFrontFile.originalname,
          idBackName:    idBackFile.originalname,
          status:        'pending',
          checkoutRequestId: null,
        }
        await store.create(record)

        // ── Try real M-Pesa STK Push ────────────────────────────────────────
        const live = mpesaIsLive()

        if (live) {
          try {
            const ckId = await initiateSTKPush({ phone: mpesaPhone, amount, ref })
            await store.updateStatus(ref, 'pending', { checkoutRequestId: ckId })
          } catch (err) {
            console.error('STK Push failed:', err.response?.data || err.message)
            await store.deleteByRef(ref)
            // 400, not 502 — this is our own definitive "Safaricom declined
            // it" outcome, not a transient infra failure. Using a status
            // outside fetchWithRetry's retry set means the guest sees this
            // once and gets the real "Try Again" button, instead of the
            // client silently re-attempting a real charge for several seconds.
            return { status: 400, body: { message: 'Could not initiate M-Pesa payment. Please try again.', step: 4, field: 'mpesaPhone' } }
          }
          return { status: 200, body: { ref, live } }
        }

        // ── Reservation-only mode: no live M-Pesa credentials configured ────
        // No online payment is collected — the guest reserves now and pays
        // at the hotel. Setting MPESA_ENV=production with real Daraja
        // credentials switches this back to live STK push with no code
        // changes.
        await store.updateStatus(ref, 'reservation')
        console.log(`[RESERVATION] Booking ${ref} — no live M-Pesa credentials, guest pays at hotel`)

        // Fire-and-forget: an SMTP hang or auth failure (e.g. EMAIL_USER/PASS
        // not yet configured) must never block the response the guest is
        // waiting on — it already has their reservation either way.
        store.getByRef(ref)
          .then(r => sendEmails(r, { paid: false }))
          .catch(e => console.error('Email error:', e.message))

        return { status: 200, body: { ref, live } }
      })

      res.status(status).json(body)
    } catch (err) {
      console.error('Booking initiate error:', err)
      res.status(500).json({ message: 'Server error. Please try again.' })
    }
  },
)

// ── POST /api/booking/:ref/retry ──────────────────────────────────────────────
// Re-attempts the STK push against an existing (failed/pending) booking
// record instead of the client creating a brand-new one on every retry —
// keeps the store from accumulating duplicate rows with re-uploaded ID
// images for what is, from the guest's point of view, one booking attempt.
router.post('/:ref/retry', stkLimiter, async (req, res) => {
  try {
    const record = await store.getByRef(req.params.ref)
    if (!record) return fail(res, 404, 'We could not find that booking. Please start again.', 0, 'room')
    if (record.status === 'success' || record.status === 'reservation')
      return fail(res, 400, 'This booking has already been submitted.', 4, '_general')

    const phone = (req.body?.mpesaPhone || record.b.mpesaPhone || record.b.phone || '').trim()
    if (!phone) return fail(res, 400, 'Enter your M-Pesa phone number.', 4, 'mpesaPhone')

    const live = mpesaIsLive()
    const clientRequestId = req.body?.clientRequestId

    const { status, body } = await withIdempotency(clientRequestId, async () => {
      if (live) {
        try {
          const ckId = await initiateSTKPush({ phone, amount: record.b.amount, ref: record.b.ref })
          await store.updateStatus(record.b.ref, 'pending', { checkoutRequestId: ckId })
        } catch (err) {
          console.error('STK retry push failed:', err.response?.data || err.message)
          // 400, not 502 — see /initiate for why this must stay outside
          // fetchWithRetry's auto-retried status set.
          return { status: 400, body: { message: 'Could not initiate M-Pesa payment. Please try again.', step: 4, field: 'mpesaPhone' } }
        }
        return { status: 200, body: { ref: record.b.ref, live } }
      }

      // Should be unreachable from the client (reservation mode never enters
      // a 'failed' payState to retry from) — kept as a safe fallback so a
      // stuck 'pending' record can't linger forever if this is ever hit.
      console.log(`[RESERVATION] Booking ${record.b.ref} — retry with no live M-Pesa credentials, guest pays at hotel`)
      await store.updateStatus(record.b.ref, 'reservation')

      // Fire-and-forget — see /initiate for why this must not be awaited
      // before responding.
      store.getByRef(record.b.ref)
        .then(r => sendEmails(r, { paid: false }))
        .catch(e => console.error('Email error:', e.message))

      return { status: 200, body: { ref: record.b.ref, live } }
    })

    res.status(status).json(body)
  } catch (err) {
    console.error('Booking retry error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// ── GET /api/booking/status/:ref ──────────────────────────────────────────────
router.get('/status/:ref', statusLimiter, async (req, res) => {
  const record = await store.getByRef(req.params.ref)
  if (!record) return res.status(404).json({ status: 'not_found' })

  // Safety net: don't rely solely on Safaricom's callback landing. If the
  // booking is still pending and we have a CheckoutRequestID, ask Daraja
  // directly — covers callback delivery failures (cold starts, a briefly
  // misconfigured MPESA_CALLBACK_URL, transient network issues) that would
  // otherwise leave a guest who actually paid staring at a timeout. Only the
  // "definitely paid" result is trusted here; anything else (including query
  // errors, which commonly just mean "still processing") is left for the
  // real callback or the next poll to resolve, so we never mis-mark a
  // slow-but-live transaction as failed.
  if (record.status === 'pending' && record.checkoutRequestId) {
    try {
      const result = await queryStkStatus({ checkoutRequestId: record.checkoutRequestId })
      if (String(result.ResultCode) === '0') {
        const mpesaRef = result.CallbackMetadata?.Item?.find?.(i => i.Name === 'MpesaReceiptNumber')?.Value || ''
        await store.updateStatus(record.b.ref, 'success', { mpesaRef })
        record.status = 'success'
        record.b.mpesaRef = mpesaRef
        // Fire-and-forget — this response is polled every 3s by a waiting
        // guest; an SMTP hang here must not stall that poll.
        sendEmails(record).catch(e => console.error('Reconciliation email error:', e.message))
      }
    } catch {
      // Still processing (Daraja errors on an in-flight query) or the query
      // itself failed — trust whatever the webhook has already recorded.
    }
  }

  res.json({ status: record.status })
})

module.exports = router
module.exports.sendEmails = sendEmails
