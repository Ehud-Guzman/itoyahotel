const express = require('express')
const store = require('../store')
const { sendEmails } = require('./booking')

const router = express.Router()

// ── POST /api/mpesa/callback ──────────────────────────────────────────────────
// Safaricom Daraja posts here after the guest enters their M-Pesa PIN.
// Must be a public HTTPS URL — set MPESA_CALLBACK_URL in .env to your Render URL.
router.post('/callback', async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback
    if (!callback) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback

    const matched = await store.getByCheckoutRequestId(CheckoutRequestID)

    if (!matched) {
      console.warn('Callback for unknown CheckoutRequestID:', CheckoutRequestID)
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    // Safaricom can redeliver the same callback, and the status-poll
    // reconciliation fallback can also confirm the same booking. Every status
    // change goes through transitionStatus (compare-and-set), so whichever path
    // gets there first settles it and sends the emails; the others are no-ops.
    // It also means a late "failed" callback can never overwrite a booking that
    // was already confirmed as paid.
    if (ResultCode === 0) {
      // Payment successful: extract M-Pesa receipt number
      const items = CallbackMetadata?.Item || []
      const mpesaRef = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || ''
      const won = await store.transitionStatus(matched.b.ref, ['pending', 'failed'], 'success', { mpesaRef })
      if (!won) {
        console.log(`Callback for already-settled booking ${matched.b.ref} (${matched.status}) — ignoring.`)
      } else {
        matched.b.mpesaRef = mpesaRef
        matched.status     = 'success'
        console.log(`Booking ${matched.b.ref} confirmed — M-Pesa ref ${mpesaRef}`)
        // Fire-and-forget — Safaricom expects a prompt ack; an SMTP hang here
        // must not delay it (a slow/missing ack can trigger callback retries).
        sendEmails(matched).catch(e => console.error('Email error:', e.message))
      }
    } else {
      const moved = await store.transitionStatus(matched.b.ref, ['pending'], 'failed')
      if (moved) console.log(`Booking ${matched.b.ref} payment failed — ResultCode ${ResultCode}`)
    }
  } catch (err) {
    console.error('Callback error:', err)
  }

  // Safaricom expects this exact response
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

module.exports = router
