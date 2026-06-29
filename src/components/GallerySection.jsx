/* Gallery — filterable grid with lightbox, powered by Sanity CMS */
import { useState, useEffect, useCallback } from 'react'
import { useSanity, imgUrl } from '../lib/sanity'

const GALLERY_QUERY = `*[_type == "galleryImage"] | order(order asc, _createdAt desc) {
  _id, alt, category,
  "src": image.asset->url
}`

// Fallback images shown before Sanity is configured / data is loaded
const FALLBACK_IMAGES = [
  { src: '/images/exterior/hotel-exterior-1.webp',      alt: 'Hotel Exterior',       cat: 'spaces' },
  { src: '/images/lobby/lobby-1.webp',                  alt: 'Lobby',                cat: 'spaces' },
  { src: '/images/lobby/lobby-2.webp',                  alt: 'Lobby Entrance',       cat: 'spaces' },
  { src: '/images/lounge/lounge-1.webp',                alt: 'Lounge Area',          cat: 'spaces' },
  { src: '/images/reception/reception-1.webp',          alt: 'Reception',            cat: 'spaces' },
  { src: '/images/rooms/sitting-area-1.webp',           alt: 'Sitting Area',         cat: 'rooms' },
  { src: '/images/rooms/bedroom-1.webp',                alt: 'Guest Bedroom',        cat: 'rooms' },
  { src: '/images/rooms/standard-room-1.webp',          alt: 'Standard Room',        cat: 'rooms' },
  { src: '/images/rooms/deluxe-room-1.webp',            alt: 'Deluxe Room',          cat: 'rooms' },
  { src: '/images/rooms/executive-room-1.webp',         alt: 'Executive Room',       cat: 'rooms' },
  { src: '/images/dining/food-1.webp',                  alt: 'Fresh Cuisine',        cat: 'dining' },
  { src: '/images/conference/round-table-1.webp',       alt: 'Conference Hall',      cat: 'conference' },
  { src: '/images/conference/round-table-2.webp',       alt: 'Meeting Table',        cat: 'conference' },
  { src: '/images/conference/conference-green-1.webp',  alt: 'Executive Meeting',    cat: 'conference' },
  { src: '/images/conference/meeting-1.webp',           alt: 'Meeting Space',        cat: 'conference' },
  { src: '/images/events/homeland-1.webp',              alt: 'Homeland Itoya',       cat: 'events' },
  { src: '/images/events/events-1.webp',                alt: 'Event Setup',          cat: 'events' },
  { src: '/images/events/events-2.webp',                alt: 'Outdoor Event',        cat: 'events' },
  { src: '/images/events/homeland-setup.webp',          alt: 'Event Catering',       cat: 'events' },
]

const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'spaces',     label: 'Spaces' },
  { key: 'rooms',      label: 'Rooms' },
  { key: 'dining',     label: 'Dining' },
  { key: 'conference', label: 'Conference' },
  { key: 'events',     label: 'Events' },
]

const INITIAL_COUNT = 8

export default function GallerySection() {
  // Empty array fallback so we can merge Sanity images WITH local ones
  const { data: sanityRaw } = useSanity(GALLERY_QUERY, [])

  const sanityImages = (sanityRaw || []).map((img) => ({
    src: imgUrl(img.src, 900, 600),
    alt: img.alt,
    cat: img.category,
  }))

  // Sanity images appear first; local fallback fills the rest
  const allImages = [
    ...sanityImages,
    ...FALLBACK_IMAGES,
  ]

  const [activeFilter, setActiveFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [lightbox, setLightbox] = useState(null)

  const filtered = activeFilter === 'all'
    ? allImages
    : allImages.filter((img) => img.cat === activeFilter)

  const visible = filtered.slice(0, visibleCount)

  const closeLightbox = useCallback(() => setLightbox(null), [])

  const prev = useCallback(() =>
    setLightbox((i) => (i - 1 + visible.length) % visible.length),
  [visible.length])

  const next = useCallback(() =>
    setLightbox((i) => (i + 1) % visible.length),
  [visible.length])

  useEffect(() => {
    if (lightbox === null) return
    document.body.style.overflow = 'hidden'
    const handler = (e) => {
      if (e.key === 'Escape')      closeLightbox()
      if (e.key === 'ArrowLeft')   prev()
      if (e.key === 'ArrowRight')  next()
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [lightbox, closeLightbox, prev, next])

  useEffect(() => {
    setLightbox(null)
    setVisibleCount(INITIAL_COUNT)
  }, [activeFilter])

  return (
    <section id="gallery" className="bg-mist py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="section-label mb-3">Visual Journey</p>
          <div className="gold-divider mx-auto mb-6" />
          <h2 className="section-heading mb-4">
            Discover
            <br />
            <em>Hotel Itoya</em>
          </h2>
          <p className="font-sans font-light text-ink/60 max-w-xl mx-auto leading-relaxed text-sm">
            Explore spaces designed around comfort, hospitality, and memorable experiences.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`
                font-sans text-[10px] uppercase tracking-[0.25em] px-5 py-2.5
                border transition-all duration-200
                ${activeFilter === f.key
                  ? 'bg-primary border-primary text-white'
                  : 'border-stone text-ink/50 hover:border-primary hover:text-primary bg-white'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[200px]">
          {visible.map((img, index) => (
            <button
              key={img.src || index}
              onClick={() => setLightbox(index)}
              className="relative overflow-hidden rounded-sm bg-stone group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              <div className="absolute inset-x-4 bottom-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-400">
                <p className="font-serif text-sm text-white drop-shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {img.alt}
                </p>
              </div>
              <div className="absolute top-3 right-3 w-7 h-7 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Show More */}
        {visibleCount < filtered.length && (
          <div className="text-center mt-10">
            <button
              onClick={() => setVisibleCount((c) => c + 8)}
              className="border border-primary text-primary hover:bg-primary hover:text-white font-sans font-medium tracking-widest uppercase text-xs px-10 py-3.5 transition-colors duration-200"
            >
              Show More
              <span className="ml-2 text-inherit opacity-60">
                ({filtered.length - visibleCount} remaining)
              </span>
            </button>
          </div>
        )}

        <p className="text-center font-sans text-xs text-ink/35 mt-6 tracking-wide">
          Showing {visible.length} of {filtered.length} · Click any image to view full size
        </p>

      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 font-sans text-xs text-white/50 tracking-widest">
            {lightbox + 1} / {visible.length}
          </div>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            aria-label="Previous"
            className="absolute left-4 md:left-8 w-11 h-11 flex items-center justify-center border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors duration-200 z-10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Image */}
          <div className="max-w-5xl max-h-[85vh] mx-16 md:mx-24 w-full" onClick={(e) => e.stopPropagation()}>
            <img
              key={lightbox}
              src={imgUrl(visible[lightbox].src, 1400) || visible[lightbox].src}
              alt={visible[lightbox].alt}
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <p className="font-serif text-white/80 text-center mt-4 text-lg">
              {visible[lightbox].alt}
            </p>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            aria-label="Next"
            className="absolute right-4 md:right-8 w-11 h-11 flex items-center justify-center border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors duration-200 z-10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}
