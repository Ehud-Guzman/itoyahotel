/*
 * Imports the hand-picked high-resolution photos from source-images/ (the
 * local-only, gitignored raw uploads) into public/images/hero as full-size
 * WebP bases. Responsive width variants are then derived from those bases by
 * scripts/generate-image-variants.mjs.
 *
 * Run with: npm run images:hero   (then: npm run images)
 *
 * Why this exists: the hero slideshow renders full-screen, so any source
 * narrower than ~2560px gets upscaled by the browser on a normal desktop and
 * reads as soft/over-compressed. Keeping the source → published-name mapping
 * in version control (source-images/ itself is not committed) makes each
 * hero image's provenance explicit and the import repeatable.
 *
 * Idempotent — a base is left alone while it is newer than its source.
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const SRC_DIR = path.resolve('source-images')
const OUT_DIR = path.resolve('public/images/hero')

// Minimum width for a full-screen slide: below this the browser scales the
// image up on desktop viewports and the hero looks blurry.
const MIN_WIDTH = 2560
const QUALITY = 84

/**
 * source-images file → published hero base name.
 *
 * Hero images that were already published from source-images/ (and are still
 * up to date) are deliberately NOT listed here, so re-running never degrades
 * them; for reference their provenance is:
 *   homeland frontview.jpeg → hero/homeland-front-view.webp
 *   homelanddining.jpeg     → hero/homeland-dining.webp
 *   homelandeventkaren.jpeg → hero/homeland-event-karen.webp
 *   itoyadining.jpeg        → hero/itoya-dining.webp
 * (karenweding2.jpeg is also on disk but is the lowest-quality copy of that
 * shot — the published hero/karen-wedding.webp is sharper, so it is not used.)
 */
const MAP = [
  ['buildingview.jpeg',  'building-view.webp'],   // exterior, full building
  ['Chairview.jpeg',     'lobby-chairs.webp'],    // lobby seating, ITOYA branding
  ['Classicview.jpeg',   'restaurant-hall.webp'], // restaurant hall, evening
  ['corridorview.jpg',   'corridor.webp'],        // corridor / stairwell
  ['Redchairsview.jpeg', 'banquet-hall.webp'],    // banquet hall, round tables
  ['whiteview.jpg',      'lounge.webp'],          // lounge, armchairs
]

fs.mkdirSync(OUT_DIR, { recursive: true })

let written = 0
let missing = 0

for (const [source, out] of MAP) {
  const from = path.join(SRC_DIR, source)
  const to = path.join(OUT_DIR, out)

  if (!fs.existsSync(from)) {
    console.warn(`MISSING  ${source} — skipped (source-images/ is not in the repo)`)
    missing++
    continue
  }

  if (fs.existsSync(to) && fs.statSync(to).mtimeMs >= fs.statSync(from).mtimeMs) {
    console.log(`fresh    ${out}`)
    continue
  }

  const meta = await sharp(from).metadata()
  if (meta.width < MIN_WIDTH) {
    console.warn(`NARROW   ${source} (${meta.width}px < ${MIN_WIDTH}px) — skipped, would upscale`)
    missing++
    continue
  }

  await sharp(from)
    .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
    .toFile(to)

  const kb = Math.round(fs.statSync(to).size / 1024)
  console.log(`wrote    ${out}  ${meta.width}x${meta.height}  ${kb} KB`)
  written++
}

console.log(`${written} hero base(s) written, ${missing} skipped → now run: npm run images`)
