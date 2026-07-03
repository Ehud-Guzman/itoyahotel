require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const store         = require('./store')
const bookingRouter = require('./routes/booking')
const mpesaRouter   = require('./routes/mpesa')
const contactRouter = require('./routes/contact')

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
  ],
}))
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true }))

app.use('/api/booking', bookingRouter)
app.use('/api/mpesa',   mpesaRouter)
app.use('/api/contact', contactRouter)

store.init()
  .then(() => app.listen(PORT, () => console.log(`Hotel Itoya server running on :${PORT}`)))
  .catch((err) => {
    console.error('Failed to initialize booking store:', err.message)
    process.exit(1)
  })
