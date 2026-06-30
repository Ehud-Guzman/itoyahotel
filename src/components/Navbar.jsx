import { useState, useEffect, Fragment } from 'react'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Rooms', href: '#rooms' },
  { label: 'Dining', href: '#dining' },
  { label: 'Conference', href: '#conference' },
  { label: 'Events', href: '#events' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar({ onBookNow }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const ids = navLinks.map(l => l.href.slice(1))
    const onScroll = () => {
      const offset = window.scrollY + 120
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
    <header
      className={`
        fixed inset-x-0 top-0 z-50
        transition-all duration-500
        ${scrolled
          ? 'bg-white border-b border-gold/25'
          : 'bg-white border-b border-stone/50'
        }
      `}
    >
      {/* PARTNERSHIP BANNER */}
      <div
        className={`
          hidden lg:block overflow-hidden transition-all duration-500
          ${scrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}
        `}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-2.5">
          <div className="
            relative overflow-hidden
            bg-[#ff020a]/95 backdrop-blur-sm
            border border-white/15
            rounded-full
            shadow-xl shadow-black/30
            px-4 py-2
            flex items-center gap-4
          ">
            <div className="flex-shrink-0 bg-white/95 rounded-full p-1 border border-white/30 shadow-sm">
              <img
                src="/logos/homeland-logo.webp"
                alt="Homeland Itoya"
                className="h-9 w-auto object-contain"
                width="200" height="90"
              />
            </div>
            <div className="relative w-full overflow-hidden flex-1">
              <div className="flex whitespace-nowrap animate-marquee">
                {[0, 1, 2].map(i => (
                  <span key={i} className="inline-block px-8 font-serif text-xs tracking-[0.22em] text-white">
                    <span className="text-gold mr-3">✦</span>
                    In partnership with Homeland Itoya Events
                    <span className="text-gold mx-4">·</span>
                    Elevating events &amp; outside catering with distinction
                    <span className="text-gold ml-3">✦</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN NAV */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className={`
            flex items-center justify-between
            transition-all duration-500
            ${scrolled ? 'h-[4.25rem]' : 'h-[5.5rem]'}
          `}
        >
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3.5 shrink-0 group">
            <img
              src="/logos/hotel-itoya-logo.webp"
              alt="Hotel Itoya"
              className={`
                w-auto object-contain
                transition-all duration-500
                group-hover:opacity-75
                ${scrolled ? 'h-10' : 'h-[3.25rem]'}
              `}
              width="260" height="156"
            />
            <div className="hidden sm:flex flex-col leading-none">
              <div className="h-px w-full bg-gold/50 mb-1.5" />
              <span className="font-serif text-[11.5px] tracking-[0.3em] text-ink/70 uppercase">Busia</span>
              <span className="text-[7.5px] uppercase tracking-[0.4em] text-gold/60 mt-0.5">Kenya</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center">
            {navLinks.map((link, i) => {
              const isActive = activeSection === link.href.slice(1)
              return (
              <Fragment key={link.label}>
                <a
                  href={link.href}
                  className={`
                    px-3 xl:px-5
                    font-sans text-[10.5px] tracking-[0.24em] uppercase font-medium
                    relative
                    after:absolute after:bottom-[-3px] after:left-1/2 after:-translate-x-1/2
                    after:h-px after:bg-gold
                    after:transition-all after:duration-300
                    transition-colors duration-300
                    ${isActive
                      ? 'text-gold after:w-4/5'
                      : 'text-ink/60 after:w-0 hover:text-ink hover:after:w-4/5'
                    }
                  `}
                >
                  {link.label}
                </a>
                {i < navLinks.length - 1 && (
                  <span className="text-gold/30 text-[9px] select-none pointer-events-none">|</span>
                )}
              </Fragment>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={onBookNow}
              className="
                hidden lg:inline-flex
                px-7 py-2.5
                border border-gold text-gold
                uppercase tracking-[0.22em] text-[10px] font-medium
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
                lg:hidden px-4 py-2
                border border-gold text-gold text-[10px] uppercase tracking-[0.18em]
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

      {/* MOBILE MENU */}
      <div
        className={`
          lg:hidden overflow-hidden transition-all duration-500
          bg-white/95 backdrop-blur-sm
          ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="h-px bg-gold/30 w-full" />
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
                  py-4 border-b border-stone/40
                  uppercase tracking-[0.28em] text-[11px] font-medium
                  transition-all duration-300
                  ${isActive ? 'text-gold' : 'text-ink/55 hover:text-gold hover:tracking-[0.32em]'}
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
              border border-gold text-gold py-4
              uppercase tracking-[0.28em] text-[11px] font-medium
              hover:bg-gold hover:text-white transition-all duration-300
            "
          >
            Book Now
          </button>
        </nav>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </header>
  )
}
