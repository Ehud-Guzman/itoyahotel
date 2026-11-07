import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { HERO_SLIDES, HERO_SIZES, heroPreloadTag } from '../src/data/heroSlides.js'
import { buildSrcSet } from '../src/lib/srcset.js'

const variants = JSON.parse(fs.readFileSync(new URL('../src/lib/imageVariants.json', import.meta.url), 'utf8'))

test('hero: every slide is a real file in the image manifest, at least 2560px wide', () => {
  for (const slide of HERO_SLIDES) {
    assert.ok(fs.existsSync(new URL(`../public${slide}`, import.meta.url)), `${slide} is missing from public/`)
    assert.ok(variants[slide], `${slide} is not in imageVariants.json (run npm run images)`)
    assert.ok(variants[slide].w >= 2560, `${slide} is only ${variants[slide].w}px wide, it would look soft full-screen`)
  }
})

test('hero: the preload names the first slide with the same srcset and sizes the <img> uses', () => {
  const tag = heroPreloadTag(variants)
  assert.ok(tag.includes(`href="${HERO_SLIDES[0]}"`))
  assert.ok(tag.includes(`imagesrcset="${buildSrcSet(HERO_SLIDES[0], variants)}"`))
  assert.ok(tag.includes(`imagesizes="${HERO_SIZES}"`))
  assert.ok(tag.includes('fetchpriority="high"'))
})

test('hero: index.html carries the build placeholder, not a hand-written preload that can go stale', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.ok(html.includes('<!--hero-preload-->'))
  assert.ok(!/rel="preload"[^>]*hotel-exterior/.test(html))
})
