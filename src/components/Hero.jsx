import { useEffect, useRef, useState } from 'react'
import { srcSet } from '../lib/responsive'
import { useSeason } from '../lib/season'
import { HERO_SLIDES, HERO_SIZES } from '../data/heroSlides'

export default function Hero() {
  const season = useSeason()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [welcomePhase,    setWelcomePhase]    = useState(false)
  const isFirstRun   = useRef(true)
  const welcomeTimer = useRef(null)
  const mottoTimer   = useRef(null)

  const slides = HERO_SLIDES          // shared with the build, which preloads the first one

  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // People on Data Saver, or on a 2G/3G connection, get ONE photo instead of a
  // slideshow: each slide is a full-size ~1 MB photo, and fetching a new one every
  // few seconds would swamp a slow connection. The photo they do get is the same
  // full-resolution file as everyone else's.
  const connection = typeof navigator !== 'undefined' ? navigator.connection : undefined
  const slowConnection = Boolean(connection?.saveData) || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)

  // Static mode: a single photo with the headline showing. Used for reduced motion
  // (an indefinitely auto-advancing carousel fails WCAG 2.2.2) and slow connections.
  const staticMode = prefersReducedMotion || slowConnection
  const [currentSlide, setCurrentSlide] = useState(0)
  // Slides get mounted just-in-time so the browser doesn't download all hero images
  // at startup: only the first now, and the next one once the page has finished loading.
  const [mountedSlides, setMountedSlides] = useState(() => new Set([0]))

  // The slideshow must not compete with the first photo for bandwidth. Nothing else
  // is fetched, and nothing rotates, until the page has finished loading its first
  // screen (the window "load" event) plus a short settle. Before this, the slideshow
  // started fetching slides 2, 3, 4... while the first photo was still arriving.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (staticMode) return undefined
    let timer
    const start = () => { timer = setTimeout(() => setReady(true), 1000) }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => { clearTimeout(timer); window.removeEventListener('load', start) }
  }, [staticMode])

  const isTextSlide = currentSlide % 3 === 2
  const showWelcome = welcomePhase
  const showMotto   = staticMode || (isTextSlide && !isTransitioning && !welcomePhase)

  // Photo slides keep a quick beat so visitors catch several images before
  // scrolling; text slides hold longer so the Welcome → Motto sequence
  // (1.5s settle + 2.8s Welcome + ~3.2s Motto) plays out comfortably
  useEffect(() => {
    if (staticMode || !ready) return
    const duration = currentSlide % 3 === 2 ? 7500 : 3500
    const id = setTimeout(() => {
      setCurrentSlide((s) => (s + 1) % slides.length)
    }, duration)
    return () => clearTimeout(id)
  }, [currentSlide, ready])

  // Mount the next slide ahead of time — it renders hidden (opacity-0), which
  // both preloads the image and lets the crossfade transition run on arrival
  useEffect(() => {
    if (!ready) return
    const next = (currentSlide + 1) % slides.length
    setMountedSlides((prev) => {
      if (prev.has(currentSlide) && prev.has(next)) return prev
      const grown = new Set(prev)
      grown.add(currentSlide)
      grown.add(next)
      return grown
    })
  }, [currentSlide, ready])

  // Image transition flag
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return }
    setIsTransitioning(true)
    const t = setTimeout(() => setIsTransitioning(false), 1400)
    return () => clearTimeout(t)
  }, [currentSlide])

  // Welcome → Motto sequence on text slides
  useEffect(() => {
    setWelcomePhase(false)
    clearTimeout(welcomeTimer.current)
    clearTimeout(mottoTimer.current)

    if (currentSlide % 3 === 2) {
      // Wait for image to settle, then show Welcome for 1800ms, then hand off to Motto
      welcomeTimer.current = setTimeout(() => {
        setWelcomePhase(true)
        mottoTimer.current = setTimeout(() => setWelcomePhase(false), 2800)
      }, 1500)
    }

    return () => {
      clearTimeout(welcomeTimer.current)
      clearTimeout(mottoTimer.current)
    }
  }, [currentSlide])

  return (
    <section id="home" className="relative min-h-[100svh] max-h-[100svh] sm:max-h-none sm:min-h-screen flex flex-col overflow-hidden mx-1.5">

      {/* Background slideshow */}
      <div className="absolute inset-0 z-0">
        {slides.map((src, i) => mountedSlides.has(i) && (
          <img
            key={src}
            src={src}
            srcSet={srcSet(src)}
            sizes={HERO_SIZES}
            alt={`Hero slide ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover object-center transform-gpu transition duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              currentSlide === i ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-105 -translate-y-3'
            }`}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-6 lg:px-10">

        {/* Shared text area — Motto defines the space, Welcome overlays it */}
        <div className="relative max-w-2xl w-full">

          {/* Welcome — brief overlay on all breakpoints, timed with the motto.
              The incoming text carries a 600ms delay so the outgoing one has
              mostly faded first; a straight crossfade leaves both half-visible
              on top of each other. */}
          <div
            className={`
              flex flex-col items-center justify-center
              absolute inset-0
              transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${showWelcome ? 'opacity-100 translate-y-0 delay-[600ms]' : 'opacity-0 translate-y-3 pointer-events-none'}
            `}
          >
            <p className="font-serif italic font-light text-white/85 text-3xl sm:text-4xl md:text-5xl xl:text-6xl tracking-[0.15em] sm:tracking-[0.2em] text-center drop-shadow-lg">
              Welcome To Hotel Itoya
            </p>
            <div className="h-px w-8 bg-gold/65 mt-5" />
          </div>

          {/* Motto — desktop hides it on photo slides so the images run clean
              (appears only on text slides after Welcome); mobile keeps it up
              permanently, yielding briefly to the Welcome overlay */}
          <div
            className={`
              transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${showMotto ? 'opacity-100 translate-y-0 lg:delay-[600ms]' : 'opacity-0 translate-y-3 pointer-events-none'}
              ${showWelcome ? '' : 'max-lg:opacity-100 max-lg:translate-y-0 max-lg:pointer-events-auto max-lg:delay-[600ms]'}
            `}
          >
            {/* Festive greeting: only while the Christmas theme is on */}
            {season.active && season.copy?.hero && (
              <p className="season-hero-greeting">{season.copy.hero}</p>
            )}

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
      </div>

    </section>
  )
}
