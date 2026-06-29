/* Hero Section — cinematic, premium, hotel-first */
import { useEffect, useRef, useState } from 'react'

export default function Hero() {
  const [stripVisible, setStripVisible] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isFirstRun = useRef(true)

  const slides = [
    '/images/exterior/hotel-exterior-1.webp',
    '/images/lobby/lobby-2.webp',
    '/images/lounge/lounge-1.webp',
    '/images/lobby/lobby-1.webp',
    '/images/rooms/sitting-area-1.webp',
    '/images/parking/parking-1.webp',
    '/images/parking/parking-2.webp',
    '/images/dining/food-1.webp',
    '/images/exterior/layout-1.webp',
    '/images/events/events-1.webp',
    '/images/events/events-3.webp',
    '/images/events/homeland-1.webp',
    '/images/events/homeland-setup.webp',
  ]

  const [currentSlide, setCurrentSlide] = useState(0)

  // Slideshow autoplay
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

  // Trigger cinematic text transition on slide change
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 1400)
    return () => clearTimeout(timer)
  }, [currentSlide])

  // Strip fades out once user scrolls past the hero view
  useEffect(() => {
    const handleScroll = () => setStripVisible(window.scrollY <= 180)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section id="home" className="relative min-h-[100svh] max-h-[100svh] sm:max-h-none sm:min-h-screen flex flex-col overflow-hidden mx-1.5">

      {/* Background slideshow */}
      <div className="absolute inset-0 z-0">
        {slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Hero slide ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover object-center transform-gpu transition duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform will-change-opacity ${
              currentSlide === i ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-105 -translate-y-3'
            }`}
            loading={currentSlide === i ? 'eager' : 'lazy'}
          />
        ))}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto px-6 lg:px-10 pt-40 pb-16 w-full">
        <div
          className={`
            max-w-2xl
            transition-all duration-[1500ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isTransitioning
              ? 'opacity-0 scale-[0.95] blur-[4px] -rotate-[1deg] translate-y-2'
              : 'opacity-100 scale-100 blur-0 rotate-0 translate-y-0'
            }
          `}
        >
          {/* Gold accent line */}
          <div className="relative flex justify-center mb-6">
            <div
              className={`
                h-[2px] bg-gold/80 transition-all duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isTransitioning ? 'w-0 opacity-0' : 'w-16 opacity-100'}
              `}
            />
          </div>

          <h1 className="font-serif font-light text-white leading-[1.15] mb-3 text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl tracking-wide drop-shadow-lg text-center">
            <span
              className={`
                block transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] delay-100
                ${isTransitioning ? 'opacity-0 -translate-y-6' : 'opacity-100 translate-y-0'}
              `}
            >
              Where Hospitality
            </span>
            <span
              className={`
                block font-normal text-gold-light transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] delay-250
                ${isTransitioning ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'}
              `}
            >
              Meets Value
            </span>
          </h1>

          <p
            className={`
              text-white/90 text-[10px] sm:text-[11px] tracking-[0.35em] uppercase font-sans font-light mt-6 text-center
              transition-all duration-[1000ms] ease-[cubic-bezier(0.4,0,0.2,1)] delay-400
              ${isTransitioning ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'}
            `}
          >
            Hotel Itoya · Busia, Kenya
          </p>
        </div>
      </div>

      {/* TRUST STRIP — bottom of hero flex column, fades on scroll */}
      <div
        className={`
          relative z-20 w-full
          transition-all duration-500
          ${stripVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
        `}
      >
        <div className="
          relative overflow-hidden
          bg-gradient-to-b from-[#ff020a]/30 to-[#ff020a]/90
          border-t border-white/10
          py-3
        ">
          {/* Left fade mask */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#c80008] to-transparent z-10 pointer-events-none" />
          {/* Right fade mask */}
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#c80008] to-transparent z-10 pointer-events-none" />
          <div className="flex whitespace-nowrap animate-scroll-trust">
            {[0, 1, 2].map(i => (
              <span key={i} className="inline-flex items-center gap-6 px-10 font-serif text-xs tracking-[0.22em] text-white">
                <span className="text-gold">✦</span>
                Premium Accommodation
                <span className="text-white/30">·</span>
                Conference Facilities
                <span className="text-white/30">·</span>
                Business Hospitality
                <span className="text-white/30">·</span>
                Refined Guest Experience
                <span className="text-gold">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollTrust {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-scroll-trust {
          animation: scrollTrust 22s linear infinite;
        }
      `}</style>

    </section>
  )
}
