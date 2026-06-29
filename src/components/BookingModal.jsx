import { useState, useEffect, useRef } from 'react'
import {
  FiX, FiChevronLeft, FiChevronRight,
  FiUpload, FiCheck, FiAlertCircle, FiLoader,
} from 'react-icons/fi'

// ─── Room catalogue ─────────────────────────────────────────────────────────
const ROOMS = [
  { id: 'standard',     label: 'Standard Room',     price: 3500,  confirmed: true  },
  { id: 'deluxe',       label: 'Deluxe Room',        price: 5500,  confirmed: false },
  { id: 'super-deluxe', label: 'Super Deluxe Room',  price: 8500,  confirmed: false },
  { id: 'executive',    label: 'Executive Room',     price: 12000, confirmed: false },
]

const STEPS = ['Room & Dates', 'Your Details', 'Upload ID', 'Review', 'Payment', 'Confirmed']

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function kes(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency', currency: 'KES', maximumFractionDigits: 0,
  }).format(amount)
}

function normalisePhone(raw) {
  const n = raw.replace(/\D/g, '')
  if (n.startsWith('254') && n.length === 12) return n
  if (n.startsWith('0')   && n.length === 10) return '254' + n.slice(1)
  if (n.length === 9)                         return '254' + n
  return n
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function genRef() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ITOYA-${d}-${r}`
}

const inputCls = (err) =>
  `w-full border px-3 py-2.5 text-sm text-ink outline-none transition-colors
   focus:border-gold ${err ? 'border-red-400 bg-red-50/20' : 'border-stone/50'}`

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookingModal({ isOpen, onClose, preselectedRoom = '' }) {
  const [step,       setStep]       = useState(0)
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [payState,   setPayState]   = useState('idle') // idle | waiting | success | failed
  const [bookingRef, setBookingRef] = useState('')
  const pollRef = useRef(null)

  const [data, setData] = useState({
    room: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    name: '',
    phone: '',
    email: '',
    requests: '',
    idFront:        null,
    idFrontPreview: '',
    idBack:         null,
    idBackPreview:  '',
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

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setStep(0)
    setErrors({})
    setPayState('idle')
    setBookingRef('')
    setSubmitting(false)
    setData(d => ({ ...d, room: preselectedRoom || '' }))
  }, [isOpen, preselectedRoom])

  // ── Body scroll lock ───────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const h = (e) => { if (e.key === 'Escape' && step < 4) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, step, onClose])

  // ── Poll cleanup ───────────────────────────────────────────────────────────
  useEffect(() => () => clearInterval(pollRef.current), [])

  // ── Field helpers ──────────────────────────────────────────────────────────
  const set      = (f, v)  => setData(d => ({ ...d, [f]: v }))
  const setErr   = (f, m)  => setErrors(e => ({ ...e, [f]: m }))
  const clearErr = (f)     => setErrors(e => { const n = { ...e }; delete n[f]; return n })

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!data.room)    e.room    = 'Please select a room type'
      if (!data.checkIn) e.checkIn = 'Select a check-in date'
      if (!data.checkOut)e.checkOut= 'Select a check-out date'
      if (data.checkIn && data.checkOut && nights < 1)
        e.checkOut = 'Check-out must be after check-in'
    }
    if (step === 1) {
      if (!data.name.trim()) e.name = 'Full name is required'
      if (!data.phone.trim()) {
        e.phone = 'Phone number is required'
      } else if (!/^(?:\+?254|0)[17]\d{8}$/.test(data.phone.replace(/\s/g, ''))) {
        e.phone = 'Enter a valid Kenyan phone number'
      }
      if (!data.email.trim()) {
        e.email = 'Email address is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        e.email = 'Enter a valid email address'
      }
    }
    if (step === 2) {
      if (!data.idFront) e.idFront = 'Please upload the front of your ID'
      if (!data.idBack)  e.idBack  = 'Please upload the back of your ID'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => { setErrors({}); setStep(s => s - 1) }

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFile = (field, prevField, file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setErr(field, 'File must be under 10 MB'); return }
    set(field, file)
    set(prevField, URL.createObjectURL(file))
    clearErr(field)
  }

  // ── Payment / submission ───────────────────────────────────────────────────
  const handlePay = async () => {
    const phone = data.mpesaPhone.trim() || data.phone
    if (!phone) { setErr('mpesaPhone', 'Enter your M-Pesa phone number'); return }

    setSubmitting(true)
    setPayState('waiting')
    setErrors({})

    try {
      const fd = new FormData()
      fd.append('room',       data.room)
      fd.append('roomLabel',  room?.label || '')
      fd.append('checkIn',    data.checkIn)
      fd.append('checkOut',   data.checkOut)
      fd.append('nights',     nights)
      fd.append('guests',     data.guests)
      fd.append('name',       data.name)
      fd.append('phone',      data.phone)
      fd.append('email',      data.email)
      fd.append('requests',   data.requests)
      fd.append('mpesaPhone', normalisePhone(phone))
      fd.append('amount',     total)
      fd.append('idFront',    data.idFront)
      fd.append('idBack',     data.idBack)

      const res  = await fetch(`${API}/api/booking/initiate`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Server error')

      const ref = json.ref
      setBookingRef(ref)

      // Poll for status every 3 seconds (up to 3 minutes)
      const deadline = Date.now() + 180_000
      pollRef.current = setInterval(async () => {
        if (Date.now() > deadline) {
          clearInterval(pollRef.current)
          setPayState('failed')
          setSubmitting(false)
          return
        }
        try {
          const r = await fetch(`${API}/api/booking/status/${ref}`)
          const s = await r.json()
          if (s.status === 'success') {
            clearInterval(pollRef.current)
            setPayState('success')
            setSubmitting(false)
            setStep(5)
          } else if (s.status === 'failed') {
            clearInterval(pollRef.current)
            setPayState('failed')
            setSubmitting(false)
          }
        } catch { /* keep polling */ }
      }, 3000)

    } catch (err) {
      setPayState('failed')
      setSubmitting(false)
      setErr('mpesaPhone', err.message || 'Could not initiate payment. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
        onClick={step < 4 ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white flex flex-col max-h-[93vh] shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-stone/30">
          <div>
            <p className="text-[9.5px] tracking-[0.35em] uppercase text-gold font-medium">Hotel Itoya</p>
            <h2 className="font-serif text-xl text-ink mt-0.5">Reserve Your Stay</h2>
          </div>
          {step < 5 && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-ink/35 hover:text-ink transition-colors"
            >
              <FiX size={19} />
            </button>
          )}
        </div>

        {/* ── Progress bar ── */}
        {step < 5 && (
          <div className="px-7 pt-5 pb-1">
            <div className="flex gap-1">
              {STEPS.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={`h-[2px] flex-1 transition-all duration-500 ${i <= step ? 'bg-gold' : 'bg-stone/30'}`}
                />
              ))}
            </div>
            <p className="text-[9.5px] tracking-[0.25em] uppercase text-ink/45 mt-2">
              Step {step + 1} of 5 — {STEPS[step]}
            </p>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {step === 0 && (
            <StepRoomDates
              data={data} set={set} errors={errors} clearErr={clearErr}
              today={today} minCheckout={minCheckout} room={room} nights={nights} total={total}
            />
          )}
          {step === 1 && (
            <StepDetails data={data} set={set} errors={errors} clearErr={clearErr} />
          )}
          {step === 2 && (
            <StepIdUpload data={data} handleFile={handleFile} errors={errors} />
          )}
          {step === 3 && (
            <StepReview data={data} room={room} nights={nights} total={total} />
          )}
          {step === 4 && (
            <StepPayment
              data={data} set={set} errors={errors} clearErr={clearErr}
              total={total} payState={payState}
            />
          )}
          {step === 5 && (
            <StepConfirmation bookingRef={bookingRef} data={data} onClose={onClose} />
          )}
        </div>

        {/* ── Footer nav ── */}
        {step < 5 && payState !== 'waiting' && (
          <div className="px-7 pb-7 pt-4 border-t border-stone/30 flex items-center justify-between">
            {/* Back */}
            {step > 0 && step < 4 ? (
              <button
                onClick={back}
                className="flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-ink/45 hover:text-ink transition-colors"
              >
                <FiChevronLeft size={14} /> Back
              </button>
            ) : <div />}

            {/* Forward */}
            {step < 3 && (
              <button
                onClick={next}
                className="ml-auto flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 text-[10.5px] tracking-[0.24em] uppercase transition-colors"
              >
                Continue <FiChevronRight size={13} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={next}
                className="ml-auto flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 text-[10.5px] tracking-[0.24em] uppercase transition-colors"
              >
                Proceed to Payment <FiChevronRight size={13} />
              </button>
            )}
            {step === 4 && payState !== 'failed' && (
              <button
                onClick={handlePay}
                disabled={submitting}
                className="ml-auto flex items-center gap-2 bg-[#3d8b40] hover:bg-[#2e6b30] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 text-[10.5px] tracking-[0.24em] uppercase transition-colors"
              >
                {submitting
                  ? <><FiLoader size={13} className="animate-spin" /> Processing…</>
                  : `Pay ${kes(total)}`}
              </button>
            )}
            {step === 4 && payState === 'failed' && (
              <button
                onClick={() => { setPayState('idle'); setErrors({}) }}
                className="ml-auto flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 text-[10.5px] tracking-[0.24em] uppercase transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 0 — Room & Dates ────────────────────────────────────────────────────
function StepRoomDates({ data, set, errors, clearErr, today, minCheckout, room, nights, total }) {
  return (
    <div className="space-y-6">
      {/* Room selector */}
      <div>
        <Label>Room Type</Label>
        <div className="space-y-2 mt-2">
          {ROOMS.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => { set('room', r.id); clearErr('room') }}
              className={`w-full flex justify-between items-center px-4 py-3.5 border text-left transition-all duration-200 ${
                data.room === r.id
                  ? 'border-gold bg-gold/5'
                  : 'border-stone/40 hover:border-gold/50 hover:bg-stone/10'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink">{r.label}</span>
                {!r.confirmed && (
                  <span className="text-[10px] text-ink/40 mt-0.5">Rate subject to confirmation</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-sm text-gold font-medium">
                  {kes(r.price)}<span className="text-ink/40 text-[10px]">/night</span>
                </span>
                <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center transition-all ${
                  data.room === r.id ? 'border-gold bg-gold' : 'border-stone/50'
                }`}>
                  {data.room === r.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.room && <ErrMsg>{errors.room}</ErrMsg>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Check-in</Label>
          <input
            type="date" min={today} value={data.checkIn}
            onChange={e => { set('checkIn', e.target.value); set('checkOut', ''); clearErr('checkIn') }}
            className={`mt-2 ${inputCls(errors.checkIn)}`}
          />
          {errors.checkIn && <ErrMsg>{errors.checkIn}</ErrMsg>}
        </div>
        <div>
          <Label>Check-out</Label>
          <input
            type="date" min={minCheckout} value={data.checkOut} disabled={!data.checkIn}
            onChange={e => { set('checkOut', e.target.value); clearErr('checkOut') }}
            className={`mt-2 ${inputCls(errors.checkOut)} disabled:opacity-40 disabled:cursor-not-allowed`}
          />
          {errors.checkOut && <ErrMsg>{errors.checkOut}</ErrMsg>}
        </div>
      </div>

      {/* Guests */}
      <div>
        <Label>Number of Guests</Label>
        <select
          value={data.guests}
          onChange={e => set('guests', Number(e.target.value))}
          className={`mt-2 ${inputCls(false)}`}
        >
          {[1, 2, 3, 4].map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
          ))}
        </select>
      </div>

      {/* Running total */}
      {nights > 0 && room && (
        <div className="bg-[#faf7f2] border border-gold/25 p-4">
          <div className="flex justify-between text-sm text-ink/65">
            <span>{room.label}</span>
            <span>{kes(room.price)} × {nights} night{nights > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between mt-2.5 pt-2.5 border-t border-gold/20">
            <span className="font-serif text-ink">Estimated Total</span>
            <span className="font-serif text-gold text-lg">{kes(total)}</span>
          </div>
          {!room.confirmed && (
            <p className="text-[10px] text-ink/40 mt-1.5">* Final rate confirmed by hotel</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step 1 — Guest Details ───────────────────────────────────────────────────
function StepDetails({ data, set, errors, clearErr }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink/55 leading-relaxed">
        Please provide your contact details. The hotel will use these to confirm your booking.
      </p>

      <Field label="Full Name" error={errors.name}>
        <input
          type="text" value={data.name} placeholder="As it appears on your ID"
          onChange={e => { set('name', e.target.value); clearErr('name') }}
          className={inputCls(errors.name)}
        />
      </Field>

      <Field label="Phone Number" error={errors.phone}>
        <input
          type="tel" value={data.phone} placeholder="+254 7XX XXX XXX"
          onChange={e => { set('phone', e.target.value); clearErr('phone') }}
          className={inputCls(errors.phone)}
        />
      </Field>

      <Field label="Email Address" error={errors.email}>
        <input
          type="email" value={data.email} placeholder="you@example.com"
          onChange={e => { set('email', e.target.value); clearErr('email') }}
          className={inputCls(errors.email)}
        />
      </Field>

      <Field label="Special Requests (Optional)" error="">
        <textarea
          rows={3} value={data.requests}
          placeholder="Early check-in, dietary requirements, room preferences…"
          onChange={e => set('requests', e.target.value)}
          className={`${inputCls(false)} resize-none`}
        />
      </Field>
    </div>
  )
}

// ─── Step 2 — ID Upload ───────────────────────────────────────────────────────
function StepIdUpload({ data, handleFile, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink/65 leading-relaxed">
          As required by law, Hotel Itoya must verify the identity of all guests.
          Please upload both sides of a valid government-issued ID.
        </p>
        <p className="text-[10.5px] text-ink/40 mt-2">
          Accepted: JPG, PNG, PDF · Max 10 MB · Transmitted securely
        </p>
      </div>

      <UploadZone
        label="Front of ID"
        file={data.idFront}
        preview={data.idFrontPreview}
        error={errors.idFront}
        onChange={f => handleFile('idFront', 'idFrontPreview', f)}
      />
      <UploadZone
        label="Back of ID"
        file={data.idBack}
        preview={data.idBackPreview}
        error={errors.idBack}
        onChange={f => handleFile('idBack', 'idBackPreview', f)}
      />
    </div>
  )
}

function UploadZone({ label, file, preview, error, onChange }) {
  const inputRef              = useRef(null)
  const [dragging, setDragging] = useState(false)
  const isImg = file?.type?.startsWith('image/')

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    onChange(e.dataTransfer.files?.[0])
  }

  return (
    <div>
      <Label>{label}</Label>
      <div
        role="button" tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-2 border-2 border-dashed cursor-pointer transition-all duration-200 ${
          dragging ? 'border-gold bg-gold/8' :
          error    ? 'border-red-400 bg-red-50/20' :
          file     ? 'border-gold/50 bg-gold/4' :
                     'border-stone/45 hover:border-gold/50 hover:bg-stone/5'
        }`}
      >
        <input
          ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
          onChange={e => onChange(e.target.files?.[0])}
        />
        {file ? (
          <div className="p-4 flex items-center gap-4">
            {isImg && preview
              ? <img src={preview} alt="" className="h-16 w-[5.5rem] object-cover border border-stone/20" />
              : <div className="h-16 w-[5.5rem] bg-stone/15 flex items-center justify-center shrink-0">
                  <span className="text-[10px] uppercase tracking-widest text-ink/45">PDF</span>
                </div>
            }
            <div>
              <p className="text-sm text-ink font-medium flex items-center gap-1.5">
                <FiCheck size={13} className="text-green-600" />
                {file.name}
              </p>
              <p className="text-[11px] text-ink/40 mt-0.5">
                {(file.size / 1024).toFixed(0)} KB · Click to replace
              </p>
            </div>
          </div>
        ) : (
          <div className="py-9 flex flex-col items-center gap-2">
            <FiUpload size={22} className="text-gold/55" />
            <p className="text-sm text-ink/55">Click to upload</p>
            <p className="text-xs text-ink/35">or drag & drop here</p>
          </div>
        )}
      </div>
      {error && <ErrMsg>{error}</ErrMsg>}
    </div>
  )
}

// ─── Step 3 — Review ──────────────────────────────────────────────────────────
function StepReview({ data, room, nights, total }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink/55">Please review your booking details before proceeding to payment.</p>

      <div className="border border-stone/35 divide-y divide-stone/25">
        <Row label="Room"     value={room?.label || '—'} />
        <Row label="Check-in" value={fmtDate(data.checkIn)} />
        <Row label="Check-out"value={fmtDate(data.checkOut)} />
        <Row label="Nights"   value={`${nights} night${nights !== 1 ? 's' : ''}`} />
        <Row label="Guests"   value={`${data.guests} guest${data.guests !== 1 ? 's' : ''}`} />
        <Row label="Name"     value={data.name} />
        <Row label="Phone"    value={data.phone} />
        <Row label="Email"    value={data.email} />
        <Row label="ID"       value="✓ Both sides uploaded" cls="text-green-600 font-medium" />
        {data.requests && <Row label="Requests" value={data.requests} />}
        <div className="flex justify-between items-center px-4 py-3.5 bg-[#faf7f2]">
          <span className="font-serif text-ink">Total Amount</span>
          <span className="font-serif text-gold text-xl">{kes(total)}</span>
        </div>
      </div>

      <p className="text-[11px] text-ink/40 leading-relaxed">
        Your reservation will be confirmed by the hotel after payment is received.
        You will be contacted directly to finalise your stay.
      </p>
    </div>
  )
}

// ─── Step 4 — Payment ─────────────────────────────────────────────────────────
function StepPayment({ data, set, errors, clearErr, total, payState }) {
  if (payState === 'waiting') {
    return (
      <div className="py-10 flex flex-col items-center text-center gap-6">
        <div className="w-14 h-14 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <div>
          <h3 className="font-serif text-xl text-ink">Check Your Phone</h3>
          <p className="text-sm text-ink/60 mt-3 leading-relaxed max-w-xs mx-auto">
            An M-Pesa prompt has been sent to <strong>{data.mpesaPhone || data.phone}</strong>.
            Enter your PIN to complete payment.
          </p>
        </div>
        <p className="text-[11px] text-ink/35">Do not close this window — it will update automatically.</p>
      </div>
    )
  }

  if (payState === 'failed') {
    return (
      <div className="py-10 flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 bg-red-50 flex items-center justify-center">
          <FiAlertCircle size={26} className="text-red-500" />
        </div>
        <div>
          <h3 className="font-serif text-xl text-ink">Payment Not Completed</h3>
          <p className="text-sm text-ink/55 mt-2 leading-relaxed max-w-xs mx-auto">
            The transaction was not confirmed. Please check your M-Pesa balance and try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* M-Pesa badge */}
      <div className="flex items-center gap-3 border border-[#4caf50]/35 bg-[#4caf50]/5 px-4 py-3">
        <div className="w-10 h-10 bg-[#4caf50] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm tracking-tight">M</span>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Pay via M-Pesa</p>
          <p className="text-[11px] text-ink/50 mt-0.5">You will receive a payment prompt on your phone</p>
        </div>
      </div>

      {/* Amount display */}
      <div className="text-center py-4 border-y border-stone/25">
        <p className="text-[10px] tracking-[0.3em] uppercase text-ink/45">Amount Due</p>
        <p className="font-serif text-[2.6rem] text-gold leading-none mt-2">{kes(total)}</p>
      </div>

      {/* Phone field */}
      <Field label="M-Pesa Phone Number" error={errors.mpesaPhone}>
        <input
          type="tel"
          value={data.mpesaPhone || data.phone}
          placeholder="+254 7XX XXX XXX"
          onChange={e => { set('mpesaPhone', e.target.value); clearErr('mpesaPhone') }}
          className={inputCls(errors.mpesaPhone)}
        />
        <p className="text-[10.5px] text-ink/40 mt-1.5">
          Must be the number registered with M-Pesa
        </p>
      </Field>

      <p className="text-[11px] text-ink/40 leading-relaxed">
        By clicking Pay, you agree to Hotel Itoya's booking policy.
        An STK push will be sent to your phone — enter your M-Pesa PIN to complete.
      </p>
    </div>
  )
}

// ─── Step 5 — Confirmation ────────────────────────────────────────────────────
function StepConfirmation({ bookingRef, data, onClose }) {
  return (
    <div className="py-6 flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 border border-gold/50 bg-gold/8 flex items-center justify-center">
        <FiCheck size={28} className="text-gold" />
      </div>

      <div>
        <h3 className="font-serif text-2xl text-ink">Booking Received</h3>
        <p className="text-sm text-ink/55 mt-3 leading-relaxed max-w-xs mx-auto">
          Your payment has been confirmed. Hotel Itoya will review your booking
          and contact you to finalise your stay.
        </p>
      </div>

      {/* Booking reference */}
      <div className="w-full border border-gold/30 bg-[#faf7f2] px-4 py-4">
        <p className="text-[10px] tracking-[0.3em] uppercase text-ink/45">Booking Reference</p>
        <p className="font-serif text-xl text-ink mt-1 tracking-wider">{bookingRef}</p>
      </div>

      {/* Next steps */}
      <div className="w-full text-left space-y-2.5">
        <Tick>A confirmation has been sent to <strong>{data.email}</strong></Tick>
        <Tick>The hotel will call or email you on <strong>{data.phone}</strong> to confirm</Tick>
        <Tick>Please retain your booking reference for any enquiries</Tick>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 text-[11px] tracking-[0.25em] uppercase transition-colors mt-2"
      >
        Return to Website
      </button>
    </div>
  )
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <p className="text-[10px] tracking-[0.28em] uppercase text-ink/55 font-medium">{children}</p>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <ErrMsg>{error}</ErrMsg>}
    </div>
  )
}

function ErrMsg({ children }) {
  return <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11} />{children}</p>
}

function Row({ label, value, cls = 'text-ink' }) {
  return (
    <div className="flex justify-between items-start px-4 py-2.5 gap-4">
      <span className="text-[11px] text-ink/45 tracking-wide shrink-0">{label}</span>
      <span className={`text-sm text-right ${cls}`}>{value}</span>
    </div>
  )
}

function Tick({ children }) {
  return (
    <p className="text-[12px] text-ink/55 flex items-start gap-2 leading-relaxed">
      <FiCheck size={12} className="text-gold mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
