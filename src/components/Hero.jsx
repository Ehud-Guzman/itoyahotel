import { useEffect, useRef, useState } from 'react'

export default function Hero() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isFirstRun = useRef(true)

  const slides = [
    '/images/exterior/hotel-exterior-1.webp',
    '/images/lobby/lobby-2.webp',
    '/images/lounge/lounge-1.webp',
    '/images/lobby/lobby-1.webp',
    '/images/rooms/sitting-area-1.webp',
    '/images/rooms/executive-room-1.webp',
    '/images/dining/restaurant-1.webp',
    '/images/reception/reception-2.webp',
    '/images/dining/food-1.webp',
    '/images/conference/conference-1.webp',
    '/images/exterior/layout-1.webp',
    '/images/events/events-1.webp',
    '/images/events/events-3.webp',
    '/images/exterior/itoya-1.webp',
    '/images/events/homeland-1.webp',
    '/images/events/homeland-setup.webp',
  ]

  const [currentSlide, setCurrentSlide] = useState(0)

  // Motto visible only after the slide transition has fully settled
  const showMotto = currentSlide % 3 === 2 && !isTransitioning

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % slides.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const next = (currentSlide + 1) % slides.length
    const img = new Image()
    img.src = slides[next]
  }, [currentSlide])

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 1400)
    return () => clearTimeout(timer)
  }, [currentSlide])

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
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
          />
        ))}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto px-6 lg:px-10 pt-20 lg:pt-40 pb-16 w-full">

        {/* Motto — appears only after slide has fully settled */}
        <div
          className={`
            max-w-2xl
            transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${showMotto
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 pointer-events-none'
            }
          `}
        >
          {/* Gold accent line */}
          <div className="flex justify-center mb-6">
            <div className="h-[2px] w-16 bg-gold/80" />
          </div>

          <h1 className="font-serif font-light text-white leading-[1.15] mb-3 text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl tracking-wide drop-shadow-lg text-center">
            <span className="block">Where Hospitality</span>
            <span className="block font-normal text-gold-light">Meets Value</span>
          </h1>

          <p className="text-white/90 text-[10px] sm:text-[11px] tracking-[0.35em] uppercase font-sans font-light mt-6 text-center">
            Hotel Itoya · Busia, Kenya
          </p>
        </div>
      </div>

    </section>
  )
}
