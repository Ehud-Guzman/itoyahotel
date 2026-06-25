import { useState, useEffect } from 'react'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Rooms', href: '#rooms' },
  { label: 'Conference', href: '#conference' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // --- Elevated link style with gold sliding underline ---
  const navLinkStyle = `
    font-sans text-[11px] tracking-[0.22em] uppercase font-medium text-ink/80
    relative
    after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-gold
    hover:text-ink hover:after:w-full
    after:transition-all after:duration-300
    transition-colors duration-300
  `

  return (
    <header
      className={`
        fixed inset-x-0 top-0 z-50
        transition-all duration-500 ease-out
        ${scrolled 
          ? 'bg-white/90 backdrop-blur-lg shadow-xl shadow-black/5 border-b border-white/20' 
          : 'bg-white/80 backdrop-blur-sm border-b border-stone/10'
        }
      `}
    >
      {/* --- UTILITY BAR (Concierge Level) --- */}
      <div 
        className={`
          hidden lg:block border-b border-stone/10 transition-all duration-500 ease-out
          ${scrolled ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-12 opacity-100'}
        `}
      >
        <div className="max-w-7xl mx-auto px-8">
          <div className="h-12 flex items-center justify-between gap-6">

            {/* Left: Hotel status & tagline */}
            <div className="flex items-center gap-4 text-ink/60">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
              </span>
              <div className="flex items-center gap-4">
                <span className="font-serif text-xs tracking-[0.15em] text-gold/80">
                  Hotel Itoya
                </span>
                <span className="h-4 w-px bg-stone/20" />
                <span className="text-[11px] tracking-wide text-ink/50">
                  Where hospitality meets value
                </span>
              </div>
            </div>

            {/* Right: Utility links */}
            <div className="flex items-center gap-8 text-[11px]">
              {['Rewards', 'Corporate', 'Agent', 'Careers'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className={navLinkStyle}>
                  {item}
                </a>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* --- MAIN NAVIGATION --- */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div 
          className={`
            flex items-center justify-between transition-all duration-500 ease-out
            ${scrolled ? 'h-16' : 'h-24'}
          `}
        >
          {/* Logo Area */}
          <a href="#home" className="flex items-center gap-5 shrink-0 group">
            <img
              src="/hotel Itoya logo.png"
              alt="Hotel Itoya"
              className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />

            <div className="hidden sm:block h-8 w-px bg-stone/20" />

            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-serif text-[13px] tracking-[0.25em] text-ink/90">
                Busia
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-ink/40">
                Kenya
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 items-center justify-end gap-10">
            <nav className="flex items-center gap-8">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className={navLinkStyle}>
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA Button — lifted with shadow & subtle scale */}
            <a
              href="#contact"
              className="
                inline-flex items-center px-8 py-3
                bg-gold text-white
                uppercase tracking-[0.2em] text-[11px] font-medium
                transition-all duration-300 ease-out
                hover:bg-gold-dark hover:shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5
                active:scale-95
              "
            >
              Book Now
            </a>
          </div>

          {/* Mobile Controls */}
          <div className="lg:hidden flex items-center gap-4">
            <a
              href="#contact"
              className="
                px-5 py-2 bg-gold text-white text-[10px] uppercase tracking-[0.18em]
                transition-all duration-300 hover:shadow-md hover:shadow-gold/20
              "
            >
              Book
            </a>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              className="flex flex-col gap-1.5 p-2 group"
            >
              <span
                className={`
                  w-6 h-px bg-ink/80 transition-all duration-300
                  ${menuOpen ? 'rotate-45 translate-y-2' : 'group-hover:w-7'}
                `}
              />
              <span
                className={`
                  w-6 h-px bg-ink/80 transition-all duration-300
                  ${menuOpen ? 'opacity-0' : 'group-hover:w-5'}
                `}
              />
              <span
                className={`
                  w-6 h-px bg-ink/80 transition-all duration-300
                  ${menuOpen ? '-rotate-45 -translate-y-2' : 'group-hover:w-7'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU (Elevated Drawer) --- */}
      <div
        className={`
          lg:hidden overflow-hidden transition-all duration-500 ease-in-out
          bg-white/95 backdrop-blur-md border-t border-stone/10
          ${menuOpen ? 'max-h-[600px] opacity-100 shadow-xl' : 'max-h-0 opacity-0'}
        `}
      >
        <nav className="flex flex-col px-8 py-6 gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="
                py-4 px-2 border-b border-stone/5
                uppercase tracking-[0.2em] text-sm font-medium text-ink/70
                hover:text-gold hover:bg-stone/5 hover:pl-4
                transition-all duration-300
              "
            >
              {link.label}
            </a>
          ))}

          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="
              mt-6 text-center bg-gold text-white py-4
              uppercase tracking-[0.2em] text-sm font-medium
              hover:bg-gold-dark hover:shadow-lg hover:shadow-gold/25
              transition-all duration-300
            "
          >
            Book Now
          </a>
        </nav>
      </div>
    </header>
  )
}