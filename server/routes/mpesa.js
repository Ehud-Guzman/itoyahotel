const express = require('express')
const { bookings, sendEmails } = require('./booking')

const router = express.Router()

// ── POST /api/mpesa/callback ──────────────────────────────────────────────────
// Safaricom Daraja posts here after the guest enters their M-Pesa PIN.
// Must be a public HTTPS URL — set MPESA_CALLBACK_URL in .env to your Render URL.
router.post('/callback', async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback
    if (!callback) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback

    // Find the booking that matches this checkout request
    let matched = null
    for (const [, record] of bookings) {
      if (record.checkoutRequestId === CheckoutRequestID) {
        matched = record
        break
      }
    }

    if (!matched) {
      console.warn('Callback for unknown CheckoutRequestID:', CheckoutRequestID)
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (ResultCode === 0) {
      // Payment successful — extract M-Pesa receipt number
      const items = CallbackMetadata?.Item || []
      const mpesaRef = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || ''
      matched.b.mpesaRef = mpesaRef
      matched.status     = 'success'
      await sendEmails(matched)
      console.log(`Booking ${matched.b.ref} confirmed — M-Pesa ref ${mpesaRef}`)
    } else {
      matched.status = 'failed'
      console.log(`Booking ${matched.b.ref} payment failed — ResultCode ${ResultCode}`)
    }
  } catch (err) {
    console.error('Callback error:', err)
  }

  // Safaricom expects this exact response
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

module.exports = router
