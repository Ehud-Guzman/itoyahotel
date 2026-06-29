/* Footer — minimal premium footer */

const footerLinks = {
  Hotel: ['About Us', 'Rooms & Suites', 'Dining', 'Gallery', 'Contact'],
  Services: ['Conference Facilities', 'Concierge', 'Events Planning'],
  Info: ['Reservations Policy', 'Privacy Policy', 'Terms of Use', 'Accessibility', 'Careers'],
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-serif text-lg text-white font-medium mb-1">
                Stay Informed
              </p>
              <p className="font-sans text-xs text-white/70 tracking-wide">
                Exclusive offers, event news, and seasonal packages — direct to your inbox.
              </p>
            </div>
            <div className="flex w-full md:w-auto max-w-sm">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-white/15 border border-white/30 text-white font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-white/60 min-w-0"
              />
              <button className="bg-gold text-white font-sans font-medium tracking-widest uppercase text-xs px-6 py-3 hover:bg-gold-dark transition-colors duration-200 flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand col */}
          <div className="lg:col-span-2">
            {/* Hotel Itoya logo — mix-blend-multiply dissolves white bg into footer */}
            <div className="mb-5">
              <img
                src="/logos/hotel-itoya-logo.png"
                alt="Hotel Itoya"
                className="h-16 w-auto object-contain mix-blend-multiply"
              />
              <p className="font-sans font-light text-xs tracking-widest uppercase text-gold-light mt-2">
                Busia, Kenya
              </p>
            </div>

            <p className="font-sans font-light text-white/80 text-sm leading-relaxed mb-6 max-w-xs">
              Where Hospitality Meets Value.
            </p>

            {/* Homeland Itoya partnership */}
            <div className="mb-6">
              <div className="w-12 h-px bg-gold/50 mb-4" />
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold-light/70 mb-3">
                In Partnership With
              </p>
              <a
                href="https://homelandevents.co.ke/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="bg-white/95 rounded-full p-1.5 border border-white/30 shadow-md flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <img
                    src="/logos/homeland-logo.png"
                    alt="Homeland Itoya"
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <div>
                  <p className="text-white text-sm font-serif transition-colors duration-200 group-hover:text-gold-light">
                    Homeland Itoya
                  </p>
                  <p className="text-white/50 text-[10px] uppercase tracking-[0.15em]">
                    Events &amp; Catering
                  </p>
                </div>
              </a>
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="w-9 h-9 border border-white/15 flex items-center justify-center hover:border-gold transition-colors duration-200 group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70 group-hover:text-gold transition-colors">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="w-9 h-9 border border-white/15 flex items-center justify-center hover:border-gold transition-colors duration-200 group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70 group-hover:text-gold transition-colors">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              {/* Twitter / X */}
              <a href="#" aria-label="Twitter" className="w-9 h-9 border border-white/15 flex items-center justify-center hover:border-gold transition-colors duration-200 group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70 group-hover:text-gold transition-colors">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="font-sans text-xs tracking-widest uppercase text-gold-light mb-5">{heading}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="font-sans font-light text-sm text-white/80 hover:text-white transition-colors duration-150">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
            <p className="font-sans text-xs text-white/60">
              © {year} Hotel Itoya. All rights reserved. Busia, Kenya.
            </p>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="font-sans text-xs text-white/75">
              Created &amp; managed by{' '}
              <a
                href="https://glimmerink.co.ke/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-light transition-colors duration-200 font-medium"
              >
                Glimmerink Creations
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
