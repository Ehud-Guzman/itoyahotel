/* Find my receipt — the way back for a guest who no longer has the email.
 *
 * Two fields, both of which the guest already knows and neither of which is
 * enough on its own: the reference from their confirmation, and the phone
 * number they booked with. The server does the comparing (in constant time) and
 * answers identically whether the reference is unknown or the number is wrong,
 * so this form can't be used to find out who has stayed here.
 */
import { useEffect, useState } from 'react'
import { FiX, FiDownload, FiAlertCircle, FiLoader, FiCheckCircle } from 'react-icons/fi'
import { useFocusTrap } from '../lib/useFocusTrap'
import { downloadReceipt } from '../lib/bookingReceipt'

export default function FindReceipt({ onClose }) {
  const [ref, setRef]       = useState('')
  const [phone, setPhone]   = useState('')
  const [error, setError]   = useState('')
  const [state, setState]   = useState('idle') // idle | working | done
  const panelRef = useFocusTrap(true)

  // Escape closes; the page behind stays put while it is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const canSubmit = ref.trim().length >= 4 && phone.replace(/\D/g, '').length >= 9 && state !== 'working'

  async function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setState('working')
    try {
      await downloadReceipt({ ref: ref.trim(), phone: phone.trim() })
      setState('done')
    } catch (err) {
      setState('idle')
      setError(err.message || 'Could not prepare your receipt. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Clicking away dismisses: unlike the booking flow, nothing here is lost
          by doing it — the reference can be typed again. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="find-receipt-title"
        tabIndex={-1}
        className="relative w-full sm:max-w-[440px] bg-white shadow-2xl outline-none max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between px-8 pt-8 pb-5">
          <div>
            <span className="text-[9px] tracking-[0.4em] uppercase text-primary font-medium">
              Hotel Itoya · Busia
            </span>
            <h2 id="find-receipt-title" className="font-serif text-[1.3rem] text-ink mt-1 leading-snug">
              Find my receipt
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt finder"
            className="mt-0.5 text-ink/65 hover:text-ink transition-colors p-1"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="h-px bg-stone/20 mx-8" />

        {state === 'done' ? (
          <div className="px-8 py-8">
            <FiCheckCircle size={22} className="text-gold" />
            <p className="mt-4 font-serif text-lg text-ink leading-snug">Your receipt is downloading</p>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">
              Look in your browser&apos;s downloads for the PDF. If nothing appeared, your browser may have
              blocked it — allow downloads for this site and try once more.
            </p>
            <button
              type="button"
              onClick={() => { setState('idle'); setError('') }}
              className="mt-6 text-[11px] tracking-[0.18em] uppercase text-primary border-b border-primary/40 pb-1 hover:border-primary transition-colors"
            >
              Download again
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-8 py-7">
            <p className="text-sm text-ink/70 leading-relaxed mb-6">
              Enter the reference from your confirmation email or screen, and the phone number you booked with.
              Both are needed — the receipt shows the guest&apos;s details.
            </p>

            <label htmlFor="receipt-ref" className="block text-[10px] tracking-[0.2em] uppercase text-ink/70 mb-1.5">
              Booking reference
            </label>
            <input
              id="receipt-ref"
              value={ref}
              onChange={(e) => { setRef(e.target.value.toUpperCase()); setError('') }}
              placeholder="ITOYA-20260101-AB12"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full border border-stone/40 px-3.5 py-3 font-mono text-sm tracking-wide text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary mb-5"
            />

            <label htmlFor="receipt-phone" className="block text-[10px] tracking-[0.2em] uppercase text-ink/70 mb-1.5">
              Phone number on the booking
            </label>
            <input
              id="receipt-phone"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError('') }}
              placeholder="0712 345 678"
              inputMode="tel"
              autoComplete="tel"
              className="w-full border border-stone/40 px-3.5 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary"
            />

            {error && (
              <p role="alert" className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-red-700">
                <FiAlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-white text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === 'working'
                ? <><FiLoader size={14} className="animate-spin" /> Preparing…</>
                : <><FiDownload size={14} /> Download receipt</>}
            </button>

            <p className="mt-5 text-[11px] leading-relaxed text-ink/50">
              Lost your reference? Reply to any email from us, or call the front desk, and we will send your
              receipt again. Receipts are never listed or searchable from this site.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
