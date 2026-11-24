import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { HERO_SLIDES, HERO_SIZES, heroPreloadTag } from '../src/data/heroSlides.js'
import { mergeHeroSlides, MAX_HERO_SLIDES } from '../src/lib/heroSlides.js'
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

test('hero: Studio slides lead, built-ins fill the gaps, and the show is capped at 10', () => {
  const builtIn = HERO_SLIDES.map((src) => ({ src }))
  const upload = (i) => ({ src: `https://cdn.sanity.io/images/okmatxt0/production/slide-${i}.jpg` })

  // No uploads: the slideshow is exactly the built-in photos.
  const none = mergeHeroSlides([], builtIn)
  assert.equal(none.length, Math.min(builtIn.length, MAX_HERO_SLIDES))
  assert.deepEqual(none, builtIn.slice(0, MAX_HERO_SLIDES))

  // One upload: it shows first, and every built-in still fits (9 + 1 = 10).
  const one = mergeHeroSlides([upload(0)], builtIn)
  assert.equal(one[0].src, upload(0).src)
  assert.equal(one.length, Math.min(builtIn.length + 1, MAX_HERO_SLIDES))
  if (builtIn.length + 1 <= MAX_HERO_SLIDES) {
    assert.deepEqual(one.slice(1), builtIn)
  }

  // A second upload pushes the LAST built-in out; the earlier ones stay in order.
  const two = mergeHeroSlides([upload(0), upload(1)], builtIn)
  assert.equal(two.length, Math.min(builtIn.length + 2, MAX_HERO_SLIDES))
  assert.deepEqual(two.slice(0, 2), [upload(0), upload(1)])
  if (builtIn.length + 2 > MAX_HERO_SLIDES) {
    assert.ok(!two.some((s) => s.src === builtIn[builtIn.length - 1].src),
      'the last built-in should have been dropped')
  }

  // Deleting an upload lets the built-in it displaced come back.
  assert.deepEqual(mergeHeroSlides([upload(0)], builtIn).slice(1), builtIn.slice(0, MAX_HERO_SLIDES - 1))

  // More uploads than the cap: the cap holds and no built-in is shown.
  const many = mergeHeroSlides(Array.from({ length: 15 }, (_, i) => upload(i)), builtIn)
  assert.equal(many.length, MAX_HERO_SLIDES)
  assert.ok(many.every((s) => s.src.startsWith('https://cdn.sanity.io/')))

  // The hero is never empty, even if Sanity returns nothing.
  assert.ok(mergeHeroSlides([], builtIn).length > 0)
})

test('hero: the slideshow lives on the Homepage Photos page, with no second copy to drift', () => {
  const schemaIndex = fs.readFileSync(new URL('../studio/schemas/index.js', import.meta.url), 'utf8')
  const hero = fs.readFileSync(new URL('../src/components/Hero.jsx', import.meta.url), 'utf8')

  // The slides are an array on the homepagePhotos singleton — if heroSlide ever
  // becomes a document type again, the Studio would no longer cap it at 10.
  assert.ok(!/from '\.\/heroSlide'/.test(schemaIndex), 'heroSlide should not be a document type')
  assert.ok(schemaIndex.includes('homepagePhotos'), 'homepagePhotos should be registered')
  assert.ok(hero.includes('"homepagePhotos"'), 'Hero should read the Homepage Photos page')
  assert.ok(hero.includes('slides[defined(image.asset)]'), 'Hero should read the slides array')

  // The Events gallery shares that page; nothing may still point at the old spot.
  const events = fs.readFileSync(new URL('../src/components/EventsSection.jsx', import.meta.url), 'utf8')
  assert.ok(events.includes('"homepagePhotos"'), 'EventsSection should read the Homepage Photos page')
  assert.ok(!hero.includes('"siteSettings"'), 'Hero must not query the old siteSettings location')
  assert.ok(!events.includes('"siteSettings"'), 'EventsSection must not query the old siteSettings location')
})
