require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const bookingRouter = require('./routes/booking')
const mpesaRouter   = require('./routes/mpesa')

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

app.listen(PORT, () => console.log(`Hotel Itoya server running on :${PORT}`))
