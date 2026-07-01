import { useState, useEffect, Fragment } from 'react'

const navLinks = [
  { label: 'Home',       href: '#home' },
  { label: 'Rooms',      href: '#rooms' },
  { label: 'Dining',     href: '#dining' },
  { label: 'Conference', href: '#conference' },
  { label: 'Events',     href: '#events' },
  { label: 'Gallery',    href: '#gallery' },
  { label: 'Contact',    href: '#contact' },
]

export default function Navbar({ onBookNow }) {
  const [scrolled,      setScrolled]      = useState(false)
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  useEffect(() => {
    const ids = navLinks.map(l => l.href.slice(1))
    const onScroll = () => {
      const offset = window.scrollY + 100
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= offset) current = id
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">

      {/* ── PARTNERSHIP BAR ─────────────────────────────────────────── */}
      <div
        className={`
          hidden lg:block bg-white
          overflow-hidden transition-all duration-500
          ${scrolled ? 'max-h-0 opacity-0' : 'max-h-28 opacity-100'}
        `}
      >
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-3">
          <div className="flex items-center justify-between gap-8">

            {/* Hotel Itoya — left */}
            <a href="#home" className="shrink-0 group flex flex-col items-start gap-1">
              <img
                src="/logos/hotel-itoya-logo.webp"
                alt="Hotel Itoya"
                className="h-14 w-auto object-contain group-hover:opacity-80 transition-opacity duration-300"
                width="260" height="156"
              />
              <span className="text-[8px] tracking-[0.38em] uppercase text-ink/45 font-sans pl-0.5">
                Busia · Kenya
              </span>
            </a>

            {/* Centre partnership badge */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/60" />
                <span className="font-serif italic text-[15px] text-ink/90 tracking-wide whitespace-nowrap">
                  In Official Partnership With
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/60" />
              </div>
              <p className="text-[7.5px] uppercase tracking-[0.38em] text-ink/60 font-sans text-center">
                Luxury Accommodation &nbsp;·&nbsp; Events &amp; Occasions
              </p>
            </div>

            {/* Homeland — right */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              <img
                src="/logos/homeland-logo.webp"
                alt="Homeland Itoya Events"
                className="h-9 w-auto object-contain opacity-85"
                width="200" height="90"
              />
              <span className="text-[8px] tracking-[0.38em] uppercase text-ink/45 font-sans pr-0.5">
                Events &amp; Occasions
              </span>
            </div>

          </div>
        </div>
        {/* Bottom rule */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mx-8" />
      </div>

      {/* ── NAV LINKS BAR ───────────────────────────────────────────── */}
      <div className={`bg-white border-b transition-all duration-500 ${scrolled ? 'border-gold/25 shadow-sm shadow-black/5' : 'border-stone/25'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div
            className={`
              flex items-center justify-between lg:grid lg:grid-cols-3
              transition-all duration-500
              ${scrolled ? 'h-14' : 'h-12'}
            `}
          >
            {/* Col 1 — always visible on mobile, fades in on desktop when scrolled */}
            <div
              className={`
                flex items-center transition-all duration-500
                ${scrolled ? '' : 'lg:opacity-0 lg:pointer-events-none'}
              `}
            >
              <a href="#home" className="group shrink-0">
                <img
                  src="/logos/hotel-itoya-logo.webp"
                  alt="Hotel Itoya"
                  className="h-9 lg:h-10 w-auto object-contain group-hover:opacity-75 transition-opacity duration-300"
                  width="260" height="156"
                />
              </a>
            </div>

            {/* Col 2 — nav links centered */}
            <nav className="hidden lg:flex items-center justify-center">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.href.slice(1)
                return (
                  <Fragment key={link.label}>
                    <a
                      href={link.href}
                      className={`
                        px-3 xl:px-4
                        font-sans text-[10px] tracking-[0.22em] uppercase font-medium
                        relative
                        after:absolute after:bottom-[-2px] after:left-1/2 after:-translate-x-1/2
                        after:h-px after:bg-gold
                        after:transition-all after:duration-300
                        transition-colors duration-300
                        ${isActive
                          ? 'text-ink after:w-4/5'
                          : 'text-ink/60 after:w-0 hover:text-ink hover:after:w-4/5'
                        }
                      `}
                    >
                      {link.label}
                    </a>
                    {i < navLinks.length - 1 && (
                      <span aria-hidden="true" className="text-gold/35 text-[8px] select-none pointer-events-none">|</span>
                    )}
                  </Fragment>
                )
              })}
            </nav>

            {/* Col 3 — actions */}
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={onBookNow}
                className="
                  hidden lg:inline-flex
                  px-6 py-2
                  border border-gold text-ink
                  uppercase tracking-[0.22em] text-[9.5px] font-medium
                  transition-all duration-300
                  hover:bg-gold hover:text-white hover:-translate-y-px
                  active:scale-95
                "
              >
                Book Now
              </button>

              <button
                onClick={onBookNow}
                className="
                  lg:hidden px-4 py-1.5
                  border border-gold text-ink text-[9px] uppercase tracking-[0.18em]
                  hover:bg-gold hover:text-white transition-all duration-300
                "
              >
                Book
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
                className="lg:hidden flex flex-col gap-[5px] p-2 group"
              >
                <span className={`block w-5 h-px bg-ink/50 group-hover:bg-gold transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
                <span className={`block w-5 h-px bg-ink/50 group-hover:bg-gold transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-px bg-ink/50 group-hover:bg-gold transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── MOBILE MENU ─────────────────────────────────────────────── */}
      <div
        className={`
          lg:hidden overflow-hidden transition-all duration-500
          bg-white/95 backdrop-blur-sm
          ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="h-px bg-gold/20 w-full" />
        <nav className="flex flex-col items-center px-8 py-10">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.slice(1)
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`
                  w-full text-center
                  py-4 border-b border-white/10
                  uppercase tracking-[0.28em] text-[11px] font-medium
                  transition-all duration-300
                  ${isActive ? 'text-ink font-semibold' : 'text-ink/65 hover:text-ink hover:tracking-[0.32em]'}
                `}
              >
                {link.label}
              </a>
            )
          })}
          <button
            onClick={() => { setMenuOpen(false); onBookNow() }}
            className="
              mt-8 w-full text-center
              border border-gold text-ink py-4
              uppercase tracking-[0.28em] text-[11px] font-medium
              hover:bg-gold hover:text-white transition-all duration-300
            "
          >
            Book Now
          </button>
        </nav>
      </div>

    </header>
  )
}
