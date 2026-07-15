import { useState, useEffect, useMemo, useCallback } from 'react'
import { FiLock, FiLogOut, FiSearch, FiLoader, FiAlertCircle, FiImage, FiX } from 'react-icons/fi'
import { useFocusTrap } from '../lib/useFocusTrap'

const API         = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const TOKEN_KEY    = 'itoya_admin_token'

function kes(n) {
  return `KES ${Number(n).toLocaleString('en-KE')}`
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_STYLE = {
  success: 'bg-green-100 text-green-800',
  pending: 'bg-gold-light/40 text-primary-dark',
  failed:  'bg-red-100 text-red-800',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[status] || 'bg-stone text-ink/70'}`}>
      {status}
    </span>
  )
}

// ── Login ────────────────────────────────────────────────────────────────────
function Login({ onLoggedIn }) {
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || 'Login failed.')
      sessionStorage.setItem(TOKEN_KEY, body.token)
      onLoggedIn(body.token)
    } catch (err) {
      setError(err.message || 'Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-stone/60 p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <FiLock className="text-primary" size={20} />
          <h1 className="font-serif text-xl text-ink">Hotel Itoya — Admin</h1>
        </div>
        <label className="block text-sm text-ink/70 mb-1.5" htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-stone/40 px-4 py-3 text-sm text-ink bg-white outline-none
                     transition-colors focus:border-ink placeholder:text-ink/30 mb-4"
          placeholder="Enter staff password"
        />
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-700 mb-4">
            <FiAlertCircle size={14} /> {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-primary text-white py-3 text-sm font-medium tracking-wide
                     transition-colors hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {loading ? <FiLoader className="animate-spin" size={16} /> : null}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

// ── ID image button — fetches with auth header, hands the blob to the lightbox
function IdImageButton({ bookingRef, side, token, label, onView }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/bookings/${bookingRef}/id/${side}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Could not load image.')
      const blob = await res.blob()
      onView({ url: URL.createObjectURL(blob), type: blob.type, label: `${bookingRef} — ID ${label}` })
    } catch {
      alert('Could not load that ID image.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark underline
                 underline-offset-2 disabled:opacity-40"
    >
      {loading ? <FiLoader className="animate-spin" size={11} /> : <FiImage size={11} />}
      {label}
    </button>
  )
}

// ── ID image lightbox — in-page viewer, no new tab ────────────────────────────
function IdImageLightbox({ image, onClose }) {
  const panelRef = useFocusTrap(true)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={image.label}
        tabIndex={-1}
        className="relative max-w-4xl w-full max-h-full bg-white p-2 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-xs text-ink/60 truncate">{image.label}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink/50 hover:text-ink transition-colors p-1"
          >
            <FiX size={18} />
          </button>
        </div>
        {image.type === 'application/pdf' ? (
          <iframe src={image.url} title={image.label} className="w-full h-[75vh]" />
        ) : (
          <img src={image.url} alt={image.label} className="w-full max-h-[75vh] object-contain" />
        )}
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ token, onLogout }) {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [query,    setQuery]    = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewingImage, setViewingImage] = useState(null)

  const closeImage = useCallback(() => {
    setViewingImage((current) => {
      if (current) URL.revokeObjectURL(current.url)
      return null
    })
  }, [])

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) return onLogout()
      if (!res.ok) throw new Error('Could not load bookings.')
      setBookings(await res.json())
    } catch (err) {
      setError(err.message || 'Could not load bookings.')
    } finally {
      setLoading(false)
    }
  }, [token, onLogout])

  useEffect(() => { loadBookings() }, [loadBookings])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (!q) return true
      return [b.ref, b.name, b.phone, b.email].some((f) => (f || '').toLowerCase().includes(q))
    })
  }, [bookings, query, statusFilter])

  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-white border-b border-stone/60 px-4 md:px-8 py-4 flex items-center justify-between">
        <h1 className="font-serif text-lg md:text-xl text-ink">Hotel Itoya — Bookings</h1>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink transition-colors"
        >
          <FiLogOut size={14} /> Log out
        </button>
      </header>

      <main className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ref, name, phone, email…"
              className="w-full border border-stone/40 pl-9 pr-4 py-2.5 text-sm text-ink bg-white outline-none
                         transition-colors focus:border-ink placeholder:text-ink/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-stone/40 px-3 py-2.5 text-sm text-ink bg-white outline-none focus:border-ink"
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <span className="text-sm text-ink/50 self-center">{filtered.length} booking{filtered.length === 1 ? '' : 's'}</span>
        </div>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-ink/60 py-8">
            <FiLoader className="animate-spin" size={15} /> Loading bookings…
          </p>
        )}

        {!loading && error && (
          <p className="flex items-center gap-2 text-sm text-red-700 py-8">
            <FiAlertCircle size={15} /> {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-ink/50 py-8">No bookings match.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto bg-white border border-stone/60">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-stone/60 text-left text-ink/60 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Room</th>
                  <th className="px-4 py-3 font-medium">Check-in → Check-out</th>
                  <th className="px-4 py-3 font-medium">Guests</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Booked</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.ref} className="border-b border-stone/30 last:border-0 hover:bg-mist/50 align-top">
                    <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">{b.ref}</td>
                    <td className="px-4 py-3">
                      <div className="text-ink">{b.name}</div>
                      <div className="text-ink/50 text-xs">{b.phone}</div>
                      <div className="text-ink/50 text-xs">{b.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink/80">{b.roomLabel}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink/80">
                      {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                      <div className="text-ink/50 text-xs">{b.nights} night{b.nights === 1 ? '' : 's'}</div>
                    </td>
                    <td className="px-4 py-3 text-ink/80">{b.guests}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-ink">{kes(b.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                      {b.mpesaRef && <div className="text-ink/40 text-[11px] mt-1">{b.mpesaRef}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {b.hasIdFront && <IdImageButton bookingRef={b.ref} side="front" token={token} label="Front" onView={setViewingImage} />}
                        {b.hasIdBack  && <IdImageButton bookingRef={b.ref} side="back"  token={token} label="Back"  onView={setViewingImage} />}
                        {!b.hasIdFront && !b.hasIdBack && <span className="text-ink/30 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink/50 text-xs">{fmtDateTime(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {viewingImage && <IdImageLightbox image={viewingImage} onClose={closeImage} />}
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  if (!token) return <Login onLoggedIn={setToken} />
  return <Dashboard token={token} onLogout={handleLogout} />
}
