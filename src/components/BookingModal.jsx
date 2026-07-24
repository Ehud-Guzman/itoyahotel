import { useState, useEffect, useRef } from 'react'
import {
  FiX, FiChevronLeft, FiChevronRight,
  FiUpload, FiCheck, FiAlertCircle, FiLoader, FiDownload,
} from 'react-icons/fi'
import { ROOM_CATALOG as ROOMS } from '../lib/rooms'
import { useFocusTrap } from '../lib/useFocusTrap'
import { downloadReceipt } from '../lib/generateReceipt'

const STEPS = ['Room & Dates', 'Your Details', 'Upload ID', 'Review', 'Payment', 'Confirmed']

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function kes(n) {
  return `KES ${Number(n).toLocaleString('en-KE')}`
}

// Render's free tier spins the backend down after ~15 min idle. During a
// cold start, Render's own proxy can bounce a request with a bare 502
// before the app is even listening — that response carries none of our
// CORS headers, so the browser blocks it and fetch() throws a raw
// "Failed to fetch" TypeError. That's a transient infra hiccup, not a real
// failure, so retry through it a few times before surfacing anything to
// the guest (the keep-alive ping every 10 min makes this rare, but GitHub
// Actions cron isn't exact, so gaps past 15 min do happen).
async function fetchWithRetry(url, options, { retries = 4, delayMs = 4000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, options)
      if (!res.ok && [502, 503, 504].includes(res.status) && attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs))
        continue
      }
      return res
    } catch (err) {
      if (attempt >= retries) throw err
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

function normalisePhone(raw) {
  const n = raw.replace(/\D/g, '')
  if (n.startsWith('254') && n.length === 12) return n
  if (n.startsWith('0')   && n.length === 10) return '254' + n.slice(1)
  if (n.length === 9)                          return '254' + n
  return n
}

// Strips everything but digits first (same as normalisePhone) so a number
// typed with dashes or spaces — "0712-345-678" — validates consistently
// instead of failing here while normalisePhone would have accepted it fine.
function isValidKenyanPhone(raw) {
  const d = (raw || '').replace(/\D/g, '')
  return /^(254[17]\d{8}|0[17]\d{8}|[17]\d{8})$/.test(d)
}

const ACCEPTED_ID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inp = (err) =>
  `w-full border px-4 py-3 text-sm text-ink bg-white outline-none
   transition-colors focus:border-ink placeholder:text-ink/30
   ${err ? 'border-red-300' : 'border-stone/40 hover:border-stone/70'}`

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookingModal({ isOpen, onClose, preselected = {} }) {
  const [step,       setStep]       = useState(0)
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [payState,   setPayState]   = useState('idle')
  const [bookingRef, setBookingRef] = useState('')
  const [slowConnect, setSlowConnect] = useState(false)
  // Whether live M-Pesa payment collection is configured server-side. Starts
  // `false` (the safer default — never promises an STK push we can't back)
  // and flips to `true` only once /api/booking/config confirms it.
  const [paymentsLive, setPaymentsLive] = useState(false)
  const [paidOnline,   setPaidOnline]   = useState(false)
  const pollRef = useRef(null)
  const slowConnectTimer = useRef(null)
  // A ref, not state — `disabled={submitting}` alone leaves a window where
  // a fast double-click/double-tap fires handlePay twice before React
  // re-renders the disabled button, submitting two separate bookings for
  // one guest action. Checked synchronously at the very top of handlePay.
  const submittingRef = useRef(false)

  const [data, setData] = useState({
    room: '', checkIn: '', checkOut: '', guests: 1,
    name: '', phone: '', email: '', requests: '',
    idFront: null, idFrontPreview: '',
    idBack:  null, idBackPreview:  '',
    mpesaPhone: '',
  })

  const today       = new Date().toISOString().split('T')[0]
  const room        = ROOMS.find(r => r.id === data.room)
  const nights      = data.checkIn && data.checkOut
    ? Math.max(0, Math.ceil((new Date(data.checkOut) - new Date(data.checkIn)) / 86_400_000))
    : 0
  const total       = room && nights ? room.price * nights : 0
  const minCheckout = data.checkIn
    ? new Date(new Date(data.checkIn).getTime() + 86_400_000).toISOString().split('T')[0]
    : today

  useEffect(() => {
    if (!isOpen) {
      clearInterval(pollRef.current)
      clearTimeout(slowConnectTimer.current)
      return
    }
    setStep(0); setErrors({}); setPayState('idle')
    setBookingRef(''); setSubmitting(false); setSlowConnect(false)
    setPaidOnline(false)
    submittingRef.current = false
    setData(d => ({
      ...d,
      room:     preselected.room     || '',
      checkIn:  preselected.checkIn  || '',
      checkOut: preselected.checkOut || '',
      guests:   preselected.guests   || 1,
    }))

    // Check once per open whether live payment collection is configured, so
    // step 4 can render the right flow before the guest ever submits. Uses
    // a short retry so a cold-start blip doesn't wrongly fall back to
    // reservation-only mode for a site that's actually taking live payments.
    fetchWithRetry(`${API}/api/booking/config`, undefined, { retries: 2, delayMs: 2000 })
      .then(r => r.json())
      .then(cfg => setPaymentsLive(Boolean(cfg.live)))
      .catch(() => setPaymentsLive(false))
  }, [isOpen, preselected])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const h = e => { if (e.key === 'Escape' && step === 0) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, step, onClose])

  useEffect(() => () => { clearInterval(pollRef.current); clearTimeout(slowConnectTimer.current) }, [])

  const set      = (f, v) => setData(d => ({ ...d, [f]: v }))
  const setErr   = (f, m) => setErrors(e => ({ ...e, [f]: m }))
  const clearErr = f      => setErrors(e => { const n = { ...e }; delete n[f]; return n })

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!data.room)    e.room     = 'Please select a room'
      if (!data.checkIn) e.checkIn  = 'Select check-in date'
      if (!data.checkOut)e.checkOut = 'Select check-out date'
      if (data.checkIn && data.checkOut && nights < 1) e.checkOut = 'Check-out must be after check-in'
      if (room && room.maxGuests && data.guests > room.maxGuests)
        e.guests = `${room.label} fits up to ${room.maxGuests} guest${room.maxGuests !== 1 ? 's' : ''}`
    }
    if (step === 1) {
      if (!data.name.trim()) e.name = 'Full name is required'
      if (!data.phone.trim()) e.phone = 'Phone number is required'
      else if (!isValidKenyanPhone(data.phone))
        e.phone = 'Enter a valid Kenyan phone number'
      if (!data.email.trim()) e.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email'
    }
    if (step === 2) {
      if (!data.idFront) e.idFront = 'Upload the front of your ID'
      if (!data.idBack)  e.idBack  = 'Upload the back of your ID'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => { setErrors({}); setPayState('idle'); setStep(s => s - 1) }

  const handleFile = (field, prev, file) => {
    if (!file) return
    if (file.size > 6 * 1024 * 1024) { setErr(field, 'File must be under 6 MB'); return }
    if (!ACCEPTED_ID_TYPES.includes(file.type)) {
      setErr(field, file.type === 'image/heic' || file.type === 'image/heif'
        ? 'HEIC photos aren’t supported — switch your camera to "Most Compatible" in Settings > Camera > Formats, or choose a JPG/PNG/PDF file.'
        : 'Unsupported file type — please upload a JPG, PNG, or PDF.')
      return
    }
    set(field, file); set(prev, URL.createObjectURL(file)); clearErr(field)
  }

  const handlePay = async () => {
    // Closes the race `disabled={submitting}` alone leaves open: a fast
    // double-click/tap can fire this handler twice before React re-renders
    // the disabled button. This ref check is synchronous, so the second
    // call is rejected immediately regardless of render timing.
    if (submittingRef.current) return

    const phone = (data.mpesaPhone || data.phone).trim()
    // The M-Pesa phone field only appears (and only needs re-validating)
    // when live payment collection is actually configured — in reserve-now
    // mode we just reuse the guest's contact phone from step 1.
    if (paymentsLive) {
      if (!phone) { setErr('mpesaPhone', 'Enter your M-Pesa phone number'); return }
      if (!isValidKenyanPhone(phone)) { setErr('mpesaPhone', 'Enter a valid Kenyan phone number'); return }
    }
    submittingRef.current = true
    setSubmitting(true); setPayState('connecting'); setErrors({}); setSlowConnect(false)

    // Our backend can be cold (free-tier hosting) — if the initial request
    // takes a while, tell the guest what's happening instead of leaving a
    // bare spinner that looks stuck.
    slowConnectTimer.current = setTimeout(() => setSlowConnect(true), 6000)

    // Stable for this one submission attempt, including all of
    // fetchWithRetry's automatic retries of it (they reuse this same body)
    // — lets the server recognize a retried request as the same logical
    // attempt instead of creating a duplicate booking or firing a second
    // STK push. A genuinely new attempt (the guest clicking "Try Again"
    // after a real failure) calls handlePay fresh and gets a new id.
    const clientRequestId = crypto.randomUUID()

    try {
      let ref  = bookingRef
      // Trust the server's response over the pre-fetched config for what
      // happens next — it reflects the mode this booking actually ran
      // under. Falls back to the pre-fetched value (React state updates
      // aren't visible synchronously) only if the response omits it.
      let live = paymentsLive

      if (ref) {
        // Retrying after a previous failed attempt — reuse the existing
        // booking record instead of creating a duplicate with fresh ID
        // uploads and a brand-new reference.
        const res  = await fetchWithRetry(`${API}/api/booking/${ref}/retry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mpesaPhone: normalisePhone(phone), clientRequestId }),
        })
        const json = await res.json()
        if (!res.ok) {
          const e = new Error(json.message || 'Server error')
          e.step = json.step; e.field = json.field
          throw e
        }
        live = Boolean(json.live)
      } else {
        const fd = new FormData()
        Object.entries({
          room: data.room, roomLabel: room?.label, checkIn: data.checkIn,
          checkOut: data.checkOut, nights, guests: data.guests, name: data.name,
          phone: data.phone, email: data.email, requests: data.requests,
          mpesaPhone: normalisePhone(phone), amount: total, clientRequestId,
        }).forEach(([k, v]) => fd.append(k, v))
        fd.append('idFront', data.idFront)
        fd.append('idBack',  data.idBack)

        const res  = await fetchWithRetry(`${API}/api/booking/initiate`, { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) {
          const e = new Error(json.message || 'Server error')
          e.step = json.step; e.field = json.field
          throw e
        }
        ref  = json.ref
        live = Boolean(json.live)
      }

      setPaymentsLive(live)
      clearTimeout(slowConnectTimer.current); setSlowConnect(false)
      setBookingRef(ref)

      if (!live) {
        // Reservation-only mode: the server already finished the whole
        // thing (record saved, emails sent) inside this one request — no
        // payment to wait on.
        setPaidOnline(false)
        submittingRef.current = false
        setPayState('success'); setSubmitting(false); setStep(5)
        return
      }

      setPayState('waiting')
      const deadline = Date.now() + 180_000
      pollRef.current = setInterval(async () => {
        if (Date.now() > deadline) {
          clearInterval(pollRef.current); submittingRef.current = false; setPayState('failed'); setSubmitting(false); return
        }
        try {
          const s = await fetch(`${API}/api/booking/status/${ref}`).then(r => r.json())
          if (s.status === 'success') {
            clearInterval(pollRef.current); setPaidOnline(true); submittingRef.current = false; setPayState('success'); setSubmitting(false); setStep(5)
          } else if (s.status === 'failed') {
            clearInterval(pollRef.current); submittingRef.current = false; setPayState('failed'); setSubmitting(false)
          }
        } catch { /* keep polling */ }
      }, 3000)
    } catch (err) {
      clearTimeout(slowConnectTimer.current); setSlowConnect(false)
      submittingRef.current = false
      setSubmitting(false)

      // A raw fetch()-level failure (network drop, or all retries in
      // fetchWithRetry exhausted) has a generic browser message like
      // "Failed to fetch" — never show that verbatim to a guest.
      const isNetworkError = !(typeof err.step === 'number') && !err.field
        && (err.name === 'TypeError' || /fetch|network/i.test(err.message || ''))
      const friendlyMessage = isNetworkError
        ? 'Could not reach the booking system. Please check your connection and try again.'
        : err.message

      // Errors that trace back to an earlier step (bad room, invalid dates,
      // a rejected ID upload) belong on that step, not bolted onto the
      // M-Pesa phone field where they'd be unreadable and unfixable.
      if (typeof err.step === 'number' && err.step !== 4) {
        setPayState('idle')
        setStep(err.step)
        setErrors({ [err.field || '_general']: friendlyMessage })
      } else {
        setPayState('failed')
        setErr(err.field || '_general', friendlyMessage || 'Could not initiate payment. Please try again.')
      }
    }
  }

  const panelRef = useFocusTrap(isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop — intentionally no click-to-close to prevent accidental dismissal */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        tabIndex={-1}
        className="relative w-full sm:max-w-[520px] bg-white flex flex-col max-h-[96vh] sm:max-h-[90vh] shadow-2xl outline-none"
      >

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6">
          <div>
            <span className="text-[9px] tracking-[0.4em] uppercase text-primary font-medium">
              Hotel Itoya · Busia
            </span>
            <h2 id="booking-modal-title" className="font-serif text-[1.35rem] text-ink mt-1 leading-snug">
              Reserve Your Stay
            </h2>
          </div>
          {step < 5 && (
            <button
              onClick={() => {
                const midPayment = payState === 'connecting' || payState === 'waiting'
                if (midPayment && !window.confirm(
                  'A payment request is in progress. Closing now will not cancel it, and you may lose your booking reference on screen. Close anyway?'
                )) return
                onClose()
              }}
              className="mt-0.5 text-ink/30 hover:text-ink transition-colors p-1"
            >
              <FiX size={18} />
            </button>
          )}
        </div>

        {/* ── Step indicator ──────────────────────────────────────── */}
        {step < 5 && (
          <div className="px-8 pb-5">
            {/* Dots */}
            <div className="flex items-center gap-2 mb-3">
              {STEPS.slice(0, 5).map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i < step  ? 'bg-gold' :
                    i === step ? 'bg-ink w-2.5 h-2.5' :
                                 'bg-stone/40'
                  }`} />
                  {i < 4 && <div className={`flex-1 h-px w-6 ${i < step ? 'bg-gold/60' : 'bg-stone/25'}`} />}
                </div>
              ))}
            </div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-ink/40">
              {step + 1} / 5 — {STEPS[step]}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-stone/20 mx-8" />

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {step === 0 && <StepRoom     data={data} set={set} errors={errors} clearErr={clearErr} today={today} minCheckout={minCheckout} room={room} nights={nights} total={total} />}
          {step === 1 && <StepDetails  data={data} set={set} errors={errors} clearErr={clearErr} />}
          {step === 2 && <StepId       data={data} handleFile={handleFile} errors={errors} />}
          {step === 3 && <StepReview   data={data} room={room} nights={nights} total={total} />}
          {step === 4 && <StepPayment  data={data} set={set} errors={errors} clearErr={clearErr} total={total} payState={payState} slowConnect={slowConnect} paymentsLive={paymentsLive} />}
          {step === 5 && <StepDone     bookingRef={bookingRef} data={data} room={room} nights={nights} total={total} paid={paidOnline} onClose={onClose} />}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        {step < 5 && payState !== 'waiting' && (
          <>
            <div className="h-px bg-stone/20 mx-8" />
            <div className="px-8 py-5 flex items-center justify-between">
              {step > 0 && !(step === 4 && (payState === 'connecting' || payState === 'waiting')) ? (
                <button
                  onClick={back}
                  className="flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-ink/40 hover:text-ink transition-colors"
                >
                  <FiChevronLeft size={13} /> Back
                </button>
              ) : <div />}

              {step < 3 && (
                <button
                  onClick={next}
                  className="ml-auto flex items-center gap-2 bg-ink text-white px-8 py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-ink/80 transition-colors"
                >
                  Continue <FiChevronRight size={12} />
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={next}
                  className="ml-auto bg-ink text-white px-8 py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-ink/80 transition-colors"
                >
                  {paymentsLive ? 'Proceed to Payment' : 'Continue'}
                </button>
              )}
              {step === 4 && payState !== 'failed' && (
                <button
                  onClick={handlePay}
                  disabled={submitting}
                  className={`ml-auto flex items-center gap-2 text-white px-8 py-3 text-[10px] tracking-[0.25em] uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    paymentsLive ? 'bg-[#2d7a30] hover:bg-[#236125]' : 'bg-ink hover:bg-ink/80'
                  }`}
                >
                  {submitting
                    ? <><FiLoader size={12} className="animate-spin" /> Processing…</>
                    : paymentsLive ? `Pay ${kes(total)}` : 'Confirm Reservation'}
                </button>
              )}
              {step === 4 && payState === 'failed' && (
                <button
                  onClick={() => { setPayState('idle'); setErrors({}) }}
                  className="ml-auto bg-ink text-white px-8 py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-ink/80 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Step 0 — Room & Dates ────────────────────────────────────────────────────
function StepRoom({ data, set, errors, clearErr, today, minCheckout, room, nights, total }) {
  return (
    <div className="space-y-7">
      {/* Room picker */}
      <div>
        <Label>Select Room</Label>
        <div className="mt-3 space-y-2">
          {ROOMS.map(r => {
            const selected = data.room === r.id
            return (
              <button
                key={r.id} type="button"
                onClick={() => { set('room', r.id); clearErr('room') }}
                className={`w-full flex justify-between items-center px-5 py-4 border text-left transition-all duration-200 ${
                  selected
                    ? 'border-ink bg-ink text-white'
                    : 'border-stone/35 hover:border-ink/40 bg-white'
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-ink'}`}>
                    {r.label}
                  </p>
                  {r.note && (
                    <p className={`text-[10.5px] mt-0.5 ${selected ? 'text-white/60' : 'text-ink/40'}`}>
                      {r.note}
                    </p>
                  )}
                </div>
                <p className={`text-sm font-medium shrink-0 ml-4 ${selected ? 'text-white' : 'text-primary'}`}>
                  {kes(r.price)}<span className={`text-[10px] ml-0.5 ${selected ? 'text-white/90' : 'text-ink/60'}`}>/night</span>
                </p>
              </button>
            )
          })}
        </div>
        {errors.room && <Err>{errors.room}</Err>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Check-in" error={errors.checkIn}>
          <input
            type="date" min={today} value={data.checkIn}
            onChange={e => { set('checkIn', e.target.value); set('checkOut', ''); clearErr('checkIn') }}
            className={inp(errors.checkIn)}
          />
        </Field>
        <Field label="Check-out" error={errors.checkOut}>
          <input
            type="date" min={minCheckout} value={data.checkOut} disabled={!data.checkIn}
            onChange={e => { set('checkOut', e.target.value); clearErr('checkOut') }}
            className={`${inp(errors.checkOut)} disabled:opacity-35 disabled:cursor-not-allowed`}
          />
        </Field>
      </div>

      {/* Guests */}
      <Field label="Guests" error={errors.guests}>
        <select
          value={data.guests} onChange={e => set('guests', Number(e.target.value))}
          className={inp(errors.guests)}
        >
          {[1, 2, 3, 4].map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
          ))}
        </select>
      </Field>

      {/* Total */}
      {nights > 0 && room && (
        <div className="border border-stone/30 p-5">
          <div className="flex justify-between text-sm text-ink/55">
            <span>{room.label}</span>
            <span>{kes(room.price)} × {nights} night{nights !== 1 ? 's' : ''}</span>
          </div>
          {room.note && (
            <p className="text-[10.5px] text-ink/35 mt-1">{room.note}</p>
          )}
          <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-stone/25">
            <span className="text-xs tracking-[0.2em] uppercase text-ink/50">Total</span>
            <span className="font-serif text-2xl text-ink">{kes(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 1 — Guest Details ───────────────────────────────────────────────────
function StepDetails({ data, set, errors, clearErr }) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/50 leading-relaxed">
        The hotel will use these details to confirm and coordinate your reservation.
      </p>

      <Field label="Full Name" error={errors.name}>
        <input type="text" value={data.name} placeholder="As on your ID"
          onChange={e => { set('name', e.target.value); clearErr('name') }}
          className={inp(errors.name)} />
      </Field>

      <Field label="Phone Number" error={errors.phone}>
        <input type="tel" value={data.phone} placeholder="+254 7XX XXX XXX"
          onChange={e => { set('phone', e.target.value); clearErr('phone') }}
          className={inp(errors.phone)} />
      </Field>

      <Field label="Email Address" error={errors.email}>
        <input type="email" value={data.email} placeholder="you@example.com"
          onChange={e => { set('email', e.target.value); clearErr('email') }}
          className={inp(errors.email)} />
      </Field>

      <Field label="Special Requests">
        <textarea rows={3} value={data.requests}
          placeholder="Early check-in, dietary needs, room preferences…"
          onChange={e => set('requests', e.target.value)}
          className={`${inp(false)} resize-none`} />
        <p className="text-[10.5px] text-ink/30 mt-1.5">Optional</p>
      </Field>
    </div>
  )
}

// ─── Step 2 — ID Upload ───────────────────────────────────────────────────────
function StepId({ data, handleFile, errors }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-[13px] text-ink/55 leading-relaxed">
          Kenyan law requires hotels to verify guest identity.
          Please upload both sides of a valid government-issued ID.
        </p>
        <p className="text-[10.5px] text-ink/35">JPG, PNG or PDF · Max 6 MB each</p>
      </div>

      <Zone label="Front of ID" file={data.idFront} preview={data.idFrontPreview}
        error={errors.idFront} onChange={f => handleFile('idFront', 'idFrontPreview', f)} />
      <Zone label="Back of ID"  file={data.idBack}  preview={data.idBackPreview}
        error={errors.idBack}  onChange={f => handleFile('idBack',  'idBackPreview',  f)} />
    </div>
  )
}

function Zone({ label, file, preview, error, onChange }) {
  const ref = useRef(null)
  const [drag, setDrag] = useState(false)
  const isImg = file?.type?.startsWith('image/')

  return (
    <div>
      <Label>{label}</Label>
      <div
        role="button" tabIndex={0}
        onClick={() => ref.current?.click()}
        onKeyDown={e => e.key === 'Enter' && ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); onChange(e.dataTransfer.files?.[0]) }}
        className={`mt-2 border-2 border-dashed cursor-pointer transition-all duration-200 ${
          drag  ? 'border-ink bg-ink/4' :
          error ? 'border-red-300 bg-red-50/20' :
          file  ? 'border-ink/30 bg-stone/5' :
                  'border-stone/35 hover:border-ink/30'
        }`}
      >
        <input ref={ref} type="file" accept="image/*,.pdf" className="hidden"
          onChange={e => onChange(e.target.files?.[0])} />

        {file ? (
          <div className="p-4 flex items-center gap-4">
            {isImg && preview
              ? <img src={preview} alt="" className="h-14 w-20 object-cover" />
              : <div className="h-14 w-20 bg-stone/15 flex items-center justify-center shrink-0">
                  <span className="text-[9px] uppercase tracking-widest text-ink/40">PDF</span>
                </div>
            }
            <div>
              <p className="text-[13px] text-ink font-medium flex items-center gap-1.5">
                <FiCheck size={12} className="text-ink" /> {file.name}
              </p>
              <p className="text-[11px] text-ink/35 mt-0.5">
                {(file.size / 1024).toFixed(0)} KB · Click to replace
              </p>
            </div>
          </div>
        ) : (
          <div className="py-9 flex flex-col items-center gap-2 text-ink/40">
            <FiUpload size={20} />
            <p className="text-[13px]">Click to upload</p>
            <p className="text-xs text-ink/25">or drag & drop</p>
          </div>
        )}
      </div>
      {error && <Err>{error}</Err>}
    </div>
  )
}

// ─── Step 3 — Review ──────────────────────────────────────────────────────────
function StepReview({ data, room, nights, total }) {
  return (
    <div className="space-y-6">
      <p className="text-[13px] text-ink/50">Review your details before payment.</p>

      <div className="divide-y divide-stone/20 border border-stone/25">
        {[
          ['Room',      room?.label || '—'],
          ['Check-in',  fmtDate(data.checkIn)],
          ['Check-out', fmtDate(data.checkOut)],
          ['Duration',  `${nights} night${nights !== 1 ? 's' : ''}`],
          ['Guests',    `${data.guests}`],
          ['Name',      data.name],
          ['Phone',     data.phone],
          ['Email',     data.email],
          ['ID',        '✓ Both sides uploaded'],
          ...(data.requests ? [['Requests', data.requests]] : []),
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-start px-5 py-3 gap-6">
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink/40 shrink-0 mt-0.5">{label}</span>
            <span className={`text-[13px] text-right ${label === 'ID' ? 'text-ink font-medium' : 'text-ink/75'}`}>
              {value}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center px-5 py-4 bg-stone/8">
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink/50">Total</span>
          <span className="font-serif text-xl text-ink">{kes(total)}</span>
        </div>
      </div>

      <p className="text-[11px] text-ink/35 leading-relaxed">
        The hotel will contact you after payment to confirm your reservation.
      </p>
    </div>
  )
}

// ─── Step 4 — Payment ─────────────────────────────────────────────────────────
function StepPayment({ data, set, errors, clearErr, total, payState, slowConnect, paymentsLive }) {
  if (payState === 'connecting') {
    return (
      <div className="py-12 flex flex-col items-center text-center gap-6">
        <div className="w-12 h-12 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-ink">
            {paymentsLive ? 'Connecting…' : 'Submitting…'}
          </h3>
          <p className="text-[13px] text-ink/50 leading-relaxed max-w-[17rem] mx-auto">
            {paymentsLive
              ? 'Sending your payment request to our secure booking system.'
              : 'Sending your reservation to Hotel Itoya.'}
          </p>
          {slowConnect && (
            <p className="text-[12px] text-ink/40 leading-relaxed max-w-[18rem] mx-auto pt-2">
              This is taking longer than usual — our booking system may be waking up.
              Please stay on this page, it can take up to a minute.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (payState === 'waiting') {
    return (
      <div className="py-12 flex flex-col items-center text-center gap-6">
        <div className="w-12 h-12 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-ink">Check Your Phone</h3>
          <p className="text-[13px] text-ink/50 leading-relaxed max-w-[17rem] mx-auto">
            An M-Pesa prompt has been sent to <strong className="text-ink">{data.mpesaPhone || data.phone}</strong>.
            Enter your PIN to complete payment.
          </p>
        </div>
        <p className="text-[11px] text-ink/30">Do not close this window — it will update automatically.</p>
      </div>
    )
  }

  if (payState === 'failed') {
    // A specific message (bad phone format, upload rejected, Safaricom
    // error) always takes priority over the generic fallback — this used to
    // be hardcoded regardless of cause, so an ID-upload failure and a real
    // M-Pesa decline showed the exact same "check your balance" text.
    const msg = errors._general || errors.mpesaPhone
    return (
      <div className="py-12 flex flex-col items-center text-center gap-5">
        <div className="w-12 h-12 border border-red-200 bg-red-50 flex items-center justify-center">
          <FiAlertCircle size={22} className="text-red-400" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-ink">
            {paymentsLive ? 'Payment Failed' : 'Could Not Submit'}
          </h3>
          <p className="text-[13px] text-ink/50 max-w-[17rem] mx-auto leading-relaxed">
            {msg || (paymentsLive
              ? 'The transaction was not confirmed. Please check your M-Pesa balance and try again.'
              : 'Something went wrong sending your reservation. Please try again.')}
          </p>
        </div>
      </div>
    )
  }

  if (!paymentsLive) {
    return (
      <div className="space-y-7">
        {/* Amount */}
        <div className="text-center py-6 border border-stone/25">
          <p className="text-[9.5px] tracking-[0.35em] uppercase text-ink/40">Amount Due at Check-in</p>
          <p className="font-serif text-[2.75rem] text-ink leading-none mt-2">{kes(total)}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-ink flex items-center justify-center shrink-0">
            <FiCheck size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink">Reserve now, pay at the hotel</p>
            <p className="text-[11px] text-ink/40">Cash or M-Pesa, on arrival</p>
          </div>
        </div>

        <p className="text-[13px] text-ink/55 leading-relaxed">
          Online payment isn't required to reserve — your room is held once
          the hotel confirms your booking by phone or email. Please have{' '}
          <strong className="text-ink">{kes(total)}</strong> ready at check-in.
        </p>

        <p className="text-[11px] text-ink/35 leading-relaxed">
          By clicking Confirm Reservation you agree to Hotel Itoya's booking terms.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Amount */}
      <div className="text-center py-6 border border-stone/25">
        <p className="text-[9.5px] tracking-[0.35em] uppercase text-ink/40">Amount Due</p>
        <p className="font-serif text-[2.75rem] text-ink leading-none mt-2">{kes(total)}</p>
      </div>

      {/* M-Pesa label */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#2d7a30] flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">M</span>
        </div>
        <div>
          <p className="text-[13px] font-medium text-ink">Pay via M-Pesa</p>
          <p className="text-[11px] text-ink/40">You will receive a prompt on your phone</p>
        </div>
      </div>

      <Field label="M-Pesa Phone Number" error={errors.mpesaPhone}>
        <input type="tel"
          value={data.mpesaPhone || data.phone}
          placeholder="+254 7XX XXX XXX"
          onChange={e => { set('mpesaPhone', e.target.value); clearErr('mpesaPhone') }}
          className={inp(errors.mpesaPhone)} />
        <p className="text-[10.5px] text-ink/30 mt-1.5">Must be the number registered with M-Pesa</p>
      </Field>

      <p className="text-[11px] text-ink/35 leading-relaxed">
        By clicking Pay you agree to Hotel Itoya's booking terms.
        An STK push will prompt you to enter your M-Pesa PIN.
      </p>
    </div>
  )
}

// ─── Step 5 — Confirmation ────────────────────────────────────────────────────
function StepDone({ bookingRef, data, room, nights, total, paid, onClose }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadReceipt({
        ref: bookingRef, roomLabel: room?.label || '—',
        checkIn: data.checkIn, checkOut: data.checkOut, nights, guests: data.guests,
        name: data.name, phone: data.phone, email: data.email,
        total, paid,
      })
    } catch (e) {
      console.error('Receipt generation failed:', e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="py-4 flex flex-col items-center text-center gap-7">
      {/* Icon */}
      <div className="w-14 h-14 bg-ink flex items-center justify-center">
        <FiCheck size={24} className="text-white" />
      </div>

      <div className="space-y-3">
        <h3 className="font-serif text-2xl text-ink">
          {paid ? 'Booking Received' : 'Reservation Received'}
        </h3>
        <p className="text-[13px] text-ink/50 leading-relaxed max-w-[20rem] mx-auto">
          {paid
            ? 'Payment confirmed. Hotel Itoya will review your booking and contact you to finalise your stay.'
            : `Hotel Itoya will review your reservation and contact you to confirm. Please have ${kes(total)} ready to pay at check-in (cash or M-Pesa).`}
        </p>
      </div>

      {/* Reference */}
      <div className="w-full border border-stone/30 py-5 px-6">
        <p className="text-[9.5px] tracking-[0.35em] uppercase text-ink/40">Booking Reference</p>
        <p className="font-serif text-xl text-ink tracking-wider mt-1.5">{bookingRef}</p>
      </div>

      {/* Checklist */}
      <div className="w-full text-left space-y-3">
        {[
          `Confirmation sent to ${data.email}`,
          `Hotel will contact you on ${data.phone}`,
          `Keep your reference for any enquiries`,
        ].map(msg => (
          <p key={msg} className="flex items-start gap-2.5 text-[12.5px] text-ink/55">
            <FiCheck size={13} className="text-ink shrink-0 mt-0.5" />
            {msg}
          </p>
        ))}
      </div>

      <div className="w-full space-y-2.5">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 border border-ink/25 text-ink py-4 text-[10px] tracking-[0.28em] uppercase hover:bg-ink/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {downloading
            ? <><FiLoader size={12} className="animate-spin" /> Preparing…</>
            : <><FiDownload size={12} /> Download Receipt</>}
        </button>
        <button
          onClick={onClose}
          className="w-full bg-ink text-white py-4 text-[10px] tracking-[0.28em] uppercase hover:bg-ink/80 transition-colors"
        >
          Return to Website
        </button>
      </div>
    </div>
  )
}

// ─── Micro components ─────────────────────────────────────────────────────────
function Label({ children }) {
  return <p className="text-[10px] tracking-[0.28em] uppercase text-ink/50 mb-2">{children}</p>
}

function Field({ label, error, children }) {
  return (
    <div>
      {label ? (
        <label className="block">
          <span className="block text-[10px] tracking-[0.28em] uppercase text-ink/50 mb-2">{label}</span>
          {children}
        </label>
      ) : children}
      {error && <Err>{error}</Err>}
    </div>
  )
}

function Err({ children }) {
  return (
    <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
      <FiAlertCircle size={10} /> {children}
    </p>
  )
}
