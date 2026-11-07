// The homepage slideshow, in one place.
//
// Hero.jsx renders these, and the build (vite.config.js) uses the very same list
// to write the <link rel="preload"> for the FIRST slide into index.html. That
// preload must name the photo the page actually shows first, with the same
// srcset and sizes the <img> uses, or the browser downloads a different image
// (this had silently drifted: the page preloaded a photo that was no longer
// first, wasting its download and leaving the real first image to be found late).
import { buildSrcSet } from '../lib/srcset.js'

// Full-screen slideshow. Every entry must be at least 2560px wide: the images
// are object-cover'd across the whole viewport, so a smaller photo is scaled
// past its native size on any ordinary desktop and reads as soft. Text slides
// (index % 3 === 2) hold longer and carry the Welcome -> Motto sequence, so
// they use the darker, more even photos where white type keeps its contrast.
export const HERO_SLIDES = [
  '/images/hero/lobby-chairs.webp',
  '/images/hero/restaurant-hall.webp',

  '/images/hero/lounge.webp',
  '/images/hero/corridor.webp',
  '/images/hero/banquet-hall.webp',

  '/images/hero/itoya-dining.webp',
  '/images/hero/homeland-dining.webp',

  '/images/hero/karen-wedding.webp',
  '/images/hero/homeland-event-karen.webp',
]

// Full-screen cover: portrait phones need width = height x 16/9, so 178vh keeps
// them on the sharpest available file.
export const HERO_SIZES = '(orientation: portrait) 178vh, 100vw'

/** The <link rel="preload"> tag for the first slide, built from the image manifest. */
export function heroPreloadTag(variants) {
  const first = HERO_SLIDES[0]
  const set = buildSrcSet(first, variants)
  return (
    `<link rel="preload" as="image" href="${first}"` +
    (set ? ` imagesrcset="${set}" imagesizes="${HERO_SIZES}"` : '') +
    ` fetchpriority="high" />`
  )
}
