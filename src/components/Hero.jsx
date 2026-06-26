/* Hero Section — cinematic, premium, hotel-first */
import { useEffect, useRef, useState } from 'react'

export default function Hero() {
  const [footerNear, setFooterNear] = useState(false)
  const [trustMode, setTrustMode] = useState('full')
  const lastScroll = useRef(0)

  const trustItems = [
    { value: 'Premium', label: 'Accommodation' },
    { value: 'Conference', label: 'Facilities' },
    { value: 'Business', label: 'Hospitality' },
    { value: 'Refined', label: 'Guest Experience' },
  ]

  const slides = [
    '/hotelitoyagpt1.png',
    '/lobby2.jpeg',
    '/lounge1.webp',
    '/lobby1.webp',
    '/sitting1.jpeg',
    '/parking1.jpeg',
    '/parking2.jpeg',
    '/food1.webp',
    '/conference2.webp',
    '/layout1.jpeg',

  ]

  const [currentSlide, setCurrentSlide] = useState(0)

  // Autoplay slideshow
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % slides.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  // Preload slides
  useEffect(() => {
    slides.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer')
      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        setFooterNear(footerRect.top <= window.innerHeight + 48)
      }

      const currentScroll = window.scrollY
      const isScrollingDown = currentScroll > lastScroll.current
      lastScroll.current = currentScroll

      if (currentScroll <= 220) {
        setTrustMode('full')
      } else if (isScrollingDown) {
        // When scrolling down, hide the trust badge completely
        setTrustMode('hidden')
      } else {
        // When scrolling up, show compact badge
        setTrustMode('compact')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section id="home" className="relative min-h-screen flex flex-col overflow-hidden">

      {/* Background slideshow */}
      <div className="absolute inset-0 z-0">
        {slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Hero slide ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transform-gpu transition duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform will-change-opacity ${
              currentSlide === i ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-105 -translate-y-3'
            }`}
            loading={currentSlide === i ? 'eager' : 'lazy'}
          />
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end max-w-7xl mx-auto px-6 lg:px-10 pb-36 pt-36 w-full">

        {/* Hero Copy */}
        <div className="max-w-2xl fade-in">

          <h1 className="font-sans font-light text-white/95 leading-tight mb-8 text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl tracking-tight drop-shadow-lg">
            Where hospitality meets value
          </h1>

          <p className="font-sans text-white/90 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
            A refined destination for accommodation, dining, conferences,
            and memorable stays.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 mb-16">

            <a
              href="#contact"
              className="btn-primary"
            >
              Book Your Stay
            </a>

            <a
              href="#rooms"
              className="btn-outline"
            >
              Explore Rooms
            </a>

          </div>
        </div>

        {/* Quick Inquiry Bar */}
        <div className="w-full rounded-lg overflow-hidden bg-white/95 backdrop-blur-md shadow-lg">

          <div className="flex flex-col md:flex-row">

            <div className="flex-1 px-6 py-5 border-b md:border-b-0 md:border-r">
              <p className="text-xs tracking-widest uppercase text-forest mb-1">
                Stay
              </p>
              <p className="text-sm text-ink">
                Business & Leisure
              </p>
            </div>

            <div className="flex-1 px-6 py-5 border-b md:border-b-0 md:border-r">
              <p className="text-xs tracking-widest uppercase text-forest mb-1">
                Conference
              </p>
              <p className="text-sm text-ink">
                Meetings & Events
              </p>
            </div>

            <div className="flex-1 px-6 py-5 border-b md:border-b-0 md:border-r">
              <p className="text-xs tracking-widest uppercase text-forest mb-1">
                Experience
              </p>
              <p className="text-sm text-ink">
                Premium Hospitality
              </p>
            </div>

            <button className="bg-gold hover:bg-gold-dark text-white px-10 py-5 uppercase tracking-widest text-xs transition">
              Check Availability
            </button>

          </div>
        </div>

      </div>

      {/* Trust Strip (fixed to bottom as a centered panel, compact badge, or hidden) */}
      <div className={`floating-panel fixed z-40 transition-all duration-300 hidden lg:block ${trustMode === 'compact' ? 'bottom-4 right-4 left-auto w-auto max-w-xs rounded-full bg-forest/95 border border-white/15 shadow-xl px-3 py-2 opacity-100' : trustMode === 'hidden' ? 'opacity-0 pointer-events-none' : 'left-1/2 w-[min(92vw,44rem)] max-w-5xl -translate-x-1/2 rounded-full bg-forest/85 border border-white/10 shadow-2xl ' + (footerNear ? 'bottom-20' : 'bottom-4')}`}>

        <div className={trustMode === 'compact' ? 'flex items-center gap-2 text-left text-[11px]' : 'flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-white/90'}>

          {trustMode === 'compact' ? (
            <>
              <span className="inline-flex h-3.5 w-3.5 shrink-0 rounded-full bg-gold animate-pulse" />
              <div>
                <p className="uppercase tracking-[0.35em] text-gold/90">
                  Trusted at a glance
                </p>
                <p className="text-white/85 text-xs leading-tight">
                  Premium rooms · Dining · Meetings
                </p>
              </div>
            </>
          ) : trustMode === 'full' ? (
            <div className="flex flex-wrap items-center justify-between gap-4 w-full">

              {trustItems.map((item) => (
                <div
                  key={item.label}
                  className="min-w-[9rem] flex-1 py-2 text-center border-white/10 last:border-0 md:border-r"
                >
                  <p className="font-serif text-base text-gold leading-none">
                    {item.value}
                  </p>

                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mt-1 leading-tight">
                    {item.label}
                  </p>
                </div>
              ))}

            </div>
          ) : null}

        </div>

      </div>

      {/* Mobile trust strip is removed completely */}

    </section>
  )
}