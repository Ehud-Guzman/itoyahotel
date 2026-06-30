import { useState, useEffect, useRef } from 'react'
import {
  FiX, FiChevronLeft, FiChevronRight,
  FiUpload, FiCheck, FiAlertCircle, FiLoader,
} from 'react-icons/fi'

// ─── Room catalogue ───────────────────────────────────────────────────────────
const ROOMS = [
  { id: 'standard',     label: 'Standard Room',    price: 3500,  note: 'Bed & Breakfast included' },
  { id: 'deluxe',       label: 'Deluxe Room',       price: 6000,  note: '' },
  { id: 'super-deluxe', label: 'Super Deluxe Room', price: 7000,  note: '' },
  { id: 'executive',    label: 'Executive Room',    price: 10000, note: '' },
]

const STEPS = ['Room & Dates', 'Your Details', 'Upload ID', 'Review', 'Payment', 'Confirmed']

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function kes(n) {
  return `KES ${Number(n).toLocaleString('en-KE')}`
}

function normalisePhone(raw) {
  const n = raw.replace(/\D/g, '')
  if (n.startsWith('254') && n.length === 12) return n
  if (n.startsWith('0')   && n.length === 10) return '254' + n.slice(1)
  if (n.length === 9)                          return '254' + n
  return n
}

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
export default function BookingModal({ isOpen, onClose, preselectedRoom = '' }) {
  const [step,       setStep]       = useState(0)
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [payState,   setPayState]   = useState('idle')
  const [bookingRef, setBookingRef] = useState('')
  const pollRef = useRef(null)

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
    if (!isOpen) return
    setStep(0); setErrors({}); setPayState('idle')
    setBookingRef(''); setSubmitting(false)
    setData(d => ({ ...d, room: preselectedRoom || '' }))
  }, [isOpen, preselectedRoom])

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

  useEffect(() => () => clearInterval(pollRef.current), [])

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
    }
    if (step === 1) {
      if (!data.name.trim()) e.name = 'Full name is required'
      if (!data.phone.trim()) e.phone = 'Phone number is required'
      else if (!/^(?:\+?254|0)[17]\d{8}$/.test(data.phone.replace(/\s/g, '')))
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
  const back = () => { setErrors({}); setStep(s => s - 1) }

  const handleFile = (field, prev, file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setErr(field, 'File must be under 10 MB'); return }
    set(field, file); set(prev, URL.createObjectURL(file)); clearErr(field)
  }

  const handlePay = async () => {
    const phone = (data.mpesaPhone || data.phone).trim()
    if (!phone) { setErr('mpesaPhone', 'Enter your M-Pesa phone number'); return }
    setSubmitting(true); setPayState('waiting'); setErrors({})

    try {
      const fd = new FormData()
      Object.entries({
        room: data.room, roomLabel: room?.label, checkIn: data.checkIn,
        checkOut: data.checkOut, nights, guests: data.guests, name: data.name,
        phone: data.phone, email: data.email, requests: data.requests,
        mpesaPhone: normalisePhone(phone), amount: total,
      }).forEach(([k, v]) => fd.append(k, v))
      fd.append('idFront', data.idFront)
      fd.append('idBack',  data.idBack)

      const res  = await fetch(`${API}/api/booking/initiate`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Server error')

      setBookingRef(json.ref)
      const deadline = Date.now() + 180_000
      pollRef.current = setInterval(async () => {
        if (Date.now() > deadline) {
          clearInterval(pollRef.current); setPayState('failed'); setSubmitting(false); return
        }
        try {
          const s = await fetch(`${API}/api/booking/status/${json.ref}`).then(r => r.json())
          if (s.status === 'success') {
            clearInterval(pollRef.current); setPayState('success'); setSubmitting(false); setStep(5)
          } else if (s.status === 'failed') {
            clearInterval(pollRef.current); setPayState('failed'); setSubmitting(false)
          }
        } catch { /* keep polling */ }
      }, 3000)
    } catch (err) {
      setPayState('failed'); setSubmitting(false)
      setErr('mpesaPhone', err.message || 'Could not initiate payment. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop — intentionally no click-to-close to prevent accidental dismissal */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Panel */}
      <div className="relative w-full sm:max-w-[520px] bg-white flex flex-col max-h-[96vh] sm:max-h-[90vh] shadow-2xl">

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6">
          <div>
            <span className="text-[9px] tracking-[0.4em] uppercase text-gold font-medium">
              Hotel Itoya · Busia
            </span>
            <h2 className="font-serif text-[1.35rem] text-ink mt-1 leading-snug">
              Reserve Your Stay
            </h2>
          </div>
          {step < 5 && (
            <button onClick={onClose} className="mt-0.5 text-ink/30 hover:text-ink transition-colors p-1">
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
          {step === 4 && <StepPayment  data={data} set={set} errors={errors} clearErr={clearErr} total={total} payState={payState} />}
          {step === 5 && <StepDone     bookingRef={bookingRef} data={data} onClose={onClose} />}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        {step < 5 && payState !== 'waiting' && (
          <>
            <div className="h-px bg-stone/20 mx-8" />
            <div className="px-8 py-5 flex items-center justify-between">
              {step > 0 && step < 4 ? (
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
                  Proceed to Payment
                </button>
              )}
              {step === 4 && payState !== 'failed' && (
                <button
                  onClick={handlePay}
                  disabled={submitting}
                  className="ml-auto flex items-center gap-2 bg-[#2d7a30] text-white px-8 py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-[#236125] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting
                    ? <><FiLoader size={12} className="animate-spin" /> Processing…</>
                    : `Pay ${kes(total)}`}
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
                <p className={`text-sm font-medium shrink-0 ml-4 ${selected ? 'text-white' : 'text-gold'}`}>
                  {kes(r.price)}<span className={`text-[10px] ml-0.5 ${selected ? 'text-white/50' : 'text-ink/35'}`}>/night</span>
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
      <Field label="Guests">
        <select
          value={data.guests} onChange={e => set('guests', Number(e.target.value))}
          className={inp(false)}
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
        <p className="text-[10.5px] text-ink/35">JPG, PNG or PDF · Max 10 MB each</p>
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
function StepPayment({ data, set, errors, clearErr, total, payState }) {
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
    return (
      <div className="py-12 flex flex-col items-center text-center gap-5">
        <div className="w-12 h-12 border border-red-200 bg-red-50 flex items-center justify-center">
          <FiAlertCircle size={22} className="text-red-400" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-ink">Payment Failed</h3>
          <p className="text-[13px] text-ink/50 max-w-[17rem] mx-auto leading-relaxed">
            The transaction was not confirmed. Please check your M-Pesa balance and try again.
          </p>
        </div>
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
function StepDone({ bookingRef, data, onClose }) {
  return (
    <div className="py-4 flex flex-col items-center text-center gap-7">
      {/* Icon */}
      <div className="w-14 h-14 bg-ink flex items-center justify-center">
        <FiCheck size={24} className="text-white" />
      </div>

      <div className="space-y-3">
        <h3 className="font-serif text-2xl text-ink">Booking Received</h3>
        <p className="text-[13px] text-ink/50 leading-relaxed max-w-[20rem] mx-auto">
          Payment confirmed. Hotel Itoya will review your booking and
          contact you to finalise your stay.
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

      <button
        onClick={onClose}
        className="w-full bg-ink text-white py-4 text-[10px] tracking-[0.28em] uppercase hover:bg-ink/80 transition-colors"
      >
        Return to Website
      </button>
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
