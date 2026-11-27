#!/usr/bin/env node
// Builds public/og-image-christmas.jpg — the social card the site points at
// while the Christmas theme is running (see the seasonOg plugin in
// vite.config.js). 1200x630, the size every network crops from.
//
//   node scripts/generate-og-image.mjs
//
// Drawn rather than photographed so it can be regenerated with the hotel's
// colours and wording at any time, and so nothing depends on a stock photo
// licence. Text is rendered by sharp/libvips with the system serif.

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const OUT = fileURLToPath(new URL('../public/og-image-christmas.jpg', import.meta.url))

// Baubles hanging from the garland: x, radius, fill. Each one is dropped from
// the curve at that x, so the strings attach exactly (see curveY below).
const BAUBLES = [
  [300, 11, '#e6c887'],
  [440, 8, '#a8331f'],
  [560, 13, '#e6c887'],
  [760, 9, '#1f5a3d'],
  [880, 12, '#e6c887'],
]

// The garland is two cubic Béziers; sample them to find the y for a given x.
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}
const SEGMENTS = [
  [[60, 118], [250, 44], [430, 44], [600, 96]],
  [[600, 96], [770, 148], [950, 148], [1140, 78]],
]
const curveY = (x) => {
  for (const [a, b, c, d] of SEGMENTS) {
    if (x < Math.min(a[0], d[0]) || x > Math.max(a[0], d[0])) continue
    let best = { distance: Infinity, y: a[1] }
    for (let i = 0; i <= 100; i += 1) {
      const t = i / 100
      const distance = Math.abs(bez(a[0], b[0], c[0], d[0], t) - x)
      if (distance < best.distance) best = { distance, y: bez(a[1], b[1], c[1], d[1], t) }
    }
    return best.y
  }
  return 96
}

const baubles = BAUBLES.map(([x, r, fill]) => {
  const top = curveY(x)
  const cy = top + 10 + r
  return `
  <line x1="${x}" y1="${top}" x2="${x}" y2="${cy - r}" stroke="#e6c887" stroke-opacity="0.55" stroke-width="1.5"/>
  <circle cx="${x}" cy="${cy}" r="${r}" fill="${fill}"/>`
}).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stop-color="#8a1c26"/>
      <stop offset="62%" stop-color="#5a1119"/>
      <stop offset="100%" stop-color="#390a10"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" x2="1">
      <stop offset="0%" stop-color="#c9a25c"/>
      <stop offset="50%" stop-color="#f3e3b6"/>
      <stop offset="100%" stop-color="#c9a25c"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="34" y="34" width="1132" height="562" fill="none" stroke="#e6c887" stroke-opacity="0.42" stroke-width="1.5"/>

  <!-- garland -->
  <path d="M60 118 C 250 44, 430 44, 600 96 C 770 148, 950 148, 1140 78"
        fill="none" stroke="#1f5a3d" stroke-width="6" stroke-linecap="round" stroke-opacity="0.85"/>
  <path d="M60 118 C 250 44, 430 44, 600 96 C 770 148, 950 148, 1140 78"
        fill="none" stroke="#e6c887" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="2 9"/>
  ${baubles}

  <text x="600" y="292" text-anchor="middle" fill="#e6c887"
        font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="7">HOTEL ITOYA &#183; BUSIA, KENYA</text>

  <text x="600" y="392" text-anchor="middle" fill="#fbecc4"
        font-family="Georgia, serif" font-size="74">Christmas at Hotel Itoya</text>

  <line x1="470" y1="432" x2="730" y2="432" stroke="url(#gold)" stroke-width="2"/>

  <text x="600" y="486" text-anchor="middle" fill="#ffffff" fill-opacity="0.88"
        font-family="Georgia, serif" font-style="italic" font-size="30">Season&#8217;s greetings from all of us</text>

  <text x="600" y="552" text-anchor="middle" fill="#e6c887" fill-opacity="0.9"
        font-family="Helvetica, Arial, sans-serif" font-size="16" letter-spacing="6">ROOMS &#183; DINING &#183; CELEBRATIONS</text>
</svg>`

await sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toFile(OUT)
console.log(`wrote ${OUT} (1200x630)`)
