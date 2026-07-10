require('dotenv').config()
const express     = require('express')
const cors        = require('cors')
const helmet      = require('helmet')
const rateLimit   = require('express-rate-limit')
const store         = require('./store')
const bookingRouter = require('./routes/booking')
const mpesaRouter   = require('./routes/mpesa')
const contactRouter = require('./routes/contact')

const app  = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
  ],
}))
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true }))

// Contact form sends through the hotel's own Gmail account — unthrottled,
// it's an easy way to flood their inbox or trip Gmail's sending limits.
// (Booking's own limiter lives in routes/booking.js, scoped to just the
// STK-push-triggering routes — /status polling needs to stay unthrottled.)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many enquiries from this device. Please wait a few minutes and try again.' },
})

app.use('/api/booking', bookingRouter)
app.use('/api/mpesa',   mpesaRouter)
app.use('/api/contact', contactLimiter, contactRouter)

store.init()
  .then(() => app.listen(PORT, () => console.log(`Hotel Itoya server running on :${PORT}`)))
  .catch((err) => {
    console.error('Failed to initialize booking store:', err.message)
    process.exit(1)
  })
