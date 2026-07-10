import { useState } from 'react'
import { FiCalendar, FiUsers, FiChevronDown, FiBriefcase } from 'react-icons/fi'
import { ROOM_CATALOG as ROOMS } from '../lib/rooms'
import useBookingBarShown from '../lib/useBookingBarShown'

const GUEST_OPTIONS = [
  '1 Room, 1 Guest',
  '1 Room, 2 Guests',
  '2 Rooms, 2 Guests',
  '2 Rooms, 3 Guests',
  '2 Rooms, 4 Guests',
  '3 Rooms, 4 Guests',
  '3 Rooms, 6 Guests',
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// The quick-search bar supports multi-room phrasing ("2 Rooms, 3 Guests")
// but the booking flow itself only ever books one room — pull out the guest
// count and clamp it to what BookingModal's guest picker supports (1-4).
function guestCountFrom(option) {
  const match = /(\d+)\s*Guests?/i.exec(option)
  const n = match ? parseInt(match[1], 10) : 1
  return Math.min(4, Math.max(1, n))
}

export default function BookingBar({ onBookNow }) {
  const { visible, hiddenByScroll } = useBookingBarShown()
  const [hovering,     setHovering]     = useState(false)
  const [checkIn,  setCheckIn]  = useState(todayStr())
  const [checkOut, setCheckOut] = useState(tomorrowStr())
  const [roomId,   setRoomId]   = useState(ROOMS[0].id)
  const [guests,   setGuests]   = useState(GUEST_OPTIONS[0])

  const selectedRoom  = ROOMS.find(r => r.id === roomId)

  const shown = visible && (!hiddenByScroll || hovering)

  return (
    <div
      role="complementary"
      aria-label="Quick booking"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`
        fixed bottom-0 inset-x-0 z-40
        hidden lg:block
        transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${shown ? 'translate-y-0' : 'translate-y-full pointer-events-none'}
      `}
    >
      <div className="bg-white border-t-2 border-gold shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4">
          <div className="flex items-end gap-3">

            {/* Room Type */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[8.5px] uppercase tracking-[0.28em] text-ink/55 font-sans font-medium flex items-center gap-1.5">
                <FiBriefcase size={9} /> Room Type
              </label>
              <div className="border border-stone/35 bg-white hover:border-gold/60 transition-colors duration-200 flex items-center px-3 gap-2">
                <select
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  className="w-full py-[9px] text-[12.5px] font-sans text-ink bg-transparent outline-none cursor-pointer appearance-none"
                >
                  {ROOMS.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <FiChevronDown size={12} className="text-ink/35 shrink-0 pointer-events-none" />
              </div>
            </div>

            <div className="w-px h-14 bg-stone/20 self-end mb-0.5" />

            {/* Check In */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[8.5px] uppercase tracking-[0.28em] text-ink/55 font-sans font-medium flex items-center gap-1.5">
                <FiCalendar size={9} /> Check In
              </label>
              <div className="border border-stone/35 bg-white hover:border-gold/60 transition-colors duration-200 flex items-center px-3 gap-2">
                <FiCalendar size={12} className="text-ink/35 shrink-0" />
                <input
                  type="date"
                  value={checkIn}
                  min={todayStr()}
                  onChange={e => {
                    setCheckIn(e.target.value)
                    if (e.target.value >= checkOut) {
                      const next = new Date(e.target.value)
                      next.setDate(next.getDate() + 1)
                      setCheckOut(next.toISOString().split('T')[0])
                    }
                  }}
                  className="w-full py-[9px] text-[12.5px] font-sans text-ink bg-transparent outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Check Out */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[8.5px] uppercase tracking-[0.28em] text-ink/55 font-sans font-medium flex items-center gap-1.5">
                <FiCalendar size={9} /> Check Out
              </label>
              <div className="border border-stone/35 bg-white hover:border-gold/60 transition-colors duration-200 flex items-center px-3 gap-2">
                <FiCalendar size={12} className="text-ink/35 shrink-0" />
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full py-[9px] text-[12.5px] font-sans text-ink bg-transparent outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Rooms & Guests */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[8.5px] uppercase tracking-[0.28em] text-ink/55 font-sans font-medium flex items-center gap-1.5">
                <FiUsers size={9} /> Rooms &amp; Guests
              </label>
              <div className="border border-stone/35 bg-white hover:border-gold/60 transition-colors duration-200 flex items-center px-3 gap-2">
                <FiUsers size={12} className="text-ink/35 shrink-0" />
                <select
                  value={guests}
                  onChange={e => setGuests(e.target.value)}
                  className="w-full py-[9px] text-[12.5px] font-sans text-ink bg-transparent outline-none cursor-pointer appearance-none"
                >
                  {GUEST_OPTIONS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <FiChevronDown size={12} className="text-ink/35 shrink-0 pointer-events-none" />
              </div>
            </div>

            <div className="w-px h-14 bg-stone/20 self-end mb-0.5" />

            {/* Price + CTA */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[8.5px] uppercase tracking-[0.28em] text-ink/55 font-sans font-medium">
                Rate Per Night
              </span>
              <div className="flex items-stretch">
                <div className="border border-r-0 border-stone/35 px-4 py-[9px] flex flex-col justify-center min-w-[110px]">
                  <span className="text-[15px] font-serif text-ink leading-tight">
                    KES {selectedRoom.price.toLocaleString('en-KE')}
                  </span>
                  <span className="text-[9px] font-sans text-ink/45 tracking-[0.12em]">
                    {selectedRoom.label}
                  </span>
                </div>
                <button
                  onClick={() => onBookNow({
                    room: roomId,
                    checkIn,
                    checkOut,
                    guests: guestCountFrom(guests),
                  })}
                  className="
                    bg-primary text-white
                    px-8
                    text-[10px] uppercase tracking-[0.28em] font-semibold
                    hover:bg-primary-dark active:scale-[0.98]
                    transition-all duration-200
                    whitespace-nowrap
                  "
                >
                  Book Now
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
