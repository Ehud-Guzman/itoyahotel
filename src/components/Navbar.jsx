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
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const linkStyle = `
    font-sans text-[11px] tracking-[0.22em] uppercase font-medium text-ink/80
    relative
    after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-gold
    hover:text-ink hover:after:w-full
    after:transition-all after:duration-300
    transition-colors duration-300
  `

  const galleryLinkStyle = `
    ${linkStyle}
    text-forest/90 font-semibold
    after:left-1/2 after:-translate-x-1/2 after:w-0
    hover:text-forest hover:after:w-10
  `

  return (
    <header
      className={`
        fixed inset-x-0 top-0 z-50
        bg-white
        border-b border-stone/100
        transition-all duration-300
        ${scrolled ? 'shadow-sm' : ''}
      `}
    >
      {/* --- PARTNERSHIP BANNER — pill container like floating trust strip --- */}
      <div
        className={`
          hidden lg:block border-b border-stone/100
          transition-all duration-300 overflow-hidden
          ${scrolled ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'}
        `}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-2">
          <div className="
            relative overflow-hidden 
            bg-forest/95 backdrop-blur-sm 
            border border-white/15 
            rounded-full 
            shadow-xl shadow-black/20
            px-6 py-2.5
          ">
{/* Text Container — marquee inside the pill */}
<div className="relative w-full overflow-hidden">
  <div className="flex whitespace-nowrap animate-marquee">
    <span className="inline-block px-8 font-serif text-sm tracking-[0.2em] text-white font-medium">
      <span className="text-gold mr-3">✦</span>
      In partnership with Homeland Itoya Events
      <span className="text-gold mx-3">◆</span>
      Elevating events &amp; outside catering with distinction
      <span className="text-gold ml-3">✦</span>
    </span>
    <span className="inline-block px-8 font-serif text-sm tracking-[0.2em] text-white font-medium">
      <span className="text-gold mr-3">✦</span>
      In partnership with Homeland Itoya Events
      <span className="text-gold mx-3">◆</span>
      Elevating events &amp; outside catering with distinction
      <span className="text-gold ml-3">✦</span>
    </span>
    <span className="inline-block px-8 font-serif text-sm tracking-[0.2em] text-white font-medium">
      <span className="text-gold mr-3">✦</span>
      In partnership with Homeland Itoya Events
      <span className="text-gold mx-3">◆</span>
      Elevating events &amp; outside catering with distinction
      <span className="text-gold ml-3">✦</span>
    </span>
  </div>
</div>

            {/* Subtle gold glow accent */}
            <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-gold/5 blur-xl pointer-events-none" />
            <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-gold/5 blur-xl pointer-events-none" />
          </div>
        </div>
      </div>

      {/* --- MAIN NAVIGATION (unchanged) --- */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className={`
            flex items-center justify-between
            transition-all duration-300
            ${scrolled ? 'h-16' : 'h-24'}
          `}
        >
          <a href="#home" className="flex items-center gap-4 shrink-0 group">
            <img
              src="/hotel Itoya logo.png"
              alt="Hotel Itoya"
              className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-serif text-[13px] tracking-[0.25em] text-ink/80">
                Busia
              </span>
              <span className="text-[9px] uppercase tracking-[0.35em] text-ink/30">
                Kenya
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={link.label === 'Gallery' ? galleryLinkStyle : linkStyle}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <a
              href="#contact"
              className="
                hidden lg:inline-flex
                px-8 py-3
                bg-gold text-white
                uppercase tracking-[0.2em] text-[11px] font-medium
                transition-all duration-300
                hover:bg-gold-dark hover:-translate-y-0.5 hover:shadow-md
                active:scale-95
              "
            >
              Book Now
            </a>

            <a
              href="#contact"
              className="lg:hidden px-5 py-2 bg-gold text-white text-[10px] uppercase tracking-[0.18em]"
            >
              Book
            </a>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              className="lg:hidden flex flex-col gap-1.5 p-2"
            >
              <span
                className={`
                  w-6 h-px bg-ink/60 transition-all duration-300
                  ${menuOpen ? 'rotate-45 translate-y-2' : ''}
                `}
              />
              <span
                className={`
                  w-6 h-px bg-ink/60 transition-all duration-300
                  ${menuOpen ? 'opacity-0' : ''}
                `}
              />
              <span
                className={`
                  w-6 h-px bg-ink/60 transition-all duration-300
                  ${menuOpen ? '-rotate-45 -translate-y-2' : ''}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU (unchanged) --- */}
      <div
        className={`
          lg:hidden overflow-hidden transition-all duration-300
          bg-white border-t border-stone/100
          ${menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <nav className="flex flex-col px-8 py-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="
                py-4 border-b border-stone/50
                uppercase tracking-[0.2em] text-sm font-medium text-ink/70
                hover:text-gold hover:pl-4
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
              hover:bg-gold-dark transition-colors
            "
          >
            Book Now
          </a>
        </nav>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 18s linear infinite;
        }
      `}</style>
    </header>
  )
}