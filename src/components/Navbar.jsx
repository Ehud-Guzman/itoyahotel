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

    return () =>
      window.removeEventListener('scroll', handleScroll)
  }, [])

  const half = Math.ceil(navLinks.length / 2)

  const navStyle =
    'font-sans text-[11px] tracking-[0.22em] uppercase font-medium text-ink hover:text-gold transition-colors duration-200'

  return (
    <header
      className={`
        fixed inset-x-0 top-0 z-50
        bg-white
        border-b border-stone/10
        transition-all duration-300
        ${scrolled ? 'shadow-sm' : ''}
      `}
    >
      {/* Utility Bar */}
      <div className={`hidden lg:block border-b border-stone/5 transition-all duration-300 ${scrolled ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-11 opacity-100'}`}>
        <div className="max-w-7xl mx-auto px-8">

          <div className="h-11 flex items-center justify-between gap-6">

            <div className="flex items-center gap-3 text-forest">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              <div>
                <p className="font-sans uppercase tracking-[0.35em] text-[10px] text-gold">
                  Hotel Itoya
                </p>
                <p className="text-[11px] text-ink/70">
                  Where hospitality meets value
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 text-[11px]">
              <a href="#rewards" className={navStyle}>
                Rewards
              </a>

              <a href="#corporate" className={navStyle}>
                Corporate
              </a>

              <a href="#agent" className={navStyle}>
                Agent
              </a>

              <a href="#careers" className={navStyle}>
                Careers
              </a>
            </div>

            <a
              href="#contact"
              className="inline-flex items-center rounded-full bg-gold px-4 py-2 text-[10px] tracking-[0.24em] uppercase text-white shadow-sm hover:bg-gold-dark transition"
            >
              Book Now
            </a>

          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-24'}`}>

          {/* Logo */}
          <a
            href="#home"
            className="
              flex
              items-center
              gap-4
              shrink-0
            "
          >
            <img
              src="/hotel Itoya logo.png"
              alt="Hotel Itoya"
              className="h-14 w-auto object-contain"
            />

            <div className="flex flex-col">

              <span
                className="
                  uppercase
                  tracking-[0.35em]
                  text-[10px]
                  text-gold
                "
              >
                Busia, Kenya
              </span>

            </div>
          </a>

          {/* Desktop */}
          <div className="hidden lg:flex flex-1 items-center justify-end">

            <nav className="flex items-center gap-10">

              {navLinks.slice(0, half).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={navStyle}
                >
                  {link.label}
                </a>
              ))}

              <div className="w-10" />

              {navLinks.slice(half).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={navStyle}
                >
                  {link.label}
                </a>
              ))}

            </nav>

            <a
              href="#contact"
              className="
                ml-12
                inline-flex
                items-center
                px-8
                py-3
                bg-gold
                text-white
                uppercase
                tracking-[0.2em]
                text-[11px]
                font-medium
                transition
                hover:bg-gold-dark
              "
            >
              Book Now
            </a>

          </div>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-4">

            <a
              href="#contact"
              className="
                px-5
                py-2
                bg-gold
                text-white
                text-[10px]
                uppercase
                tracking-[0.18em]
              "
            >
              Book
            </a>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              className="
                flex
                flex-col
                gap-1.5
                p-2
              "
            >
              <span
                className={`
                  w-6 h-px bg-black transition
                  ${menuOpen ? 'rotate-45 translate-y-2' : ''}
                `}
              />

              <span
                className={`
                  w-6 h-px bg-black transition
                  ${menuOpen ? 'opacity-0' : ''}
                `}
              />

              <span
                className={`
                  w-6 h-px bg-black transition
                  ${menuOpen ? '-rotate-45 -translate-y-2' : ''}
                `}
              />
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`
          lg:hidden
          overflow-hidden
          transition-all
          duration-300
          bg-white
          border-t
          border-stone/10
          ${
            menuOpen
              ? 'max-h-[500px] opacity-100'
              : 'max-h-0 opacity-0'
          }
        `}
      >

        <nav className="flex flex-col px-8 py-6">

          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="
                py-4
                border-b
                border-stone/10
                uppercase
                tracking-[0.2em]
                text-xs
                hover:text-gold
              "
            >
              {link.label}
            </a>
          ))}

          <a
            href="#contact"
            className="
              mt-6
              text-center
              bg-gold
              text-white
              py-4
              uppercase
              tracking-[0.2em]
            "
          >
            Book Now
          </a>

        </nav>

      </div>

    </header>
  )
}