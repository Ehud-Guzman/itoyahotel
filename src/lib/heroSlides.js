// How the homepage slideshow is assembled.
//
// The Studio's homepage photos (Site Settings → Homepage photos) always lead. The
// built-in photos are a safety net that fills whatever slots are left, so the
// homepage never loses its slideshow. The total is capped so the slideshow
// cannot grow without limit (and so the page cannot download dozens of
// full-screen photos): adding a slide pushes the last built-in out, and
// deleting one lets a built-in photo back in.
export const MAX_HERO_SLIDES = 10

/**
 * Studio slides first, built-in photos filling the remaining slots, truncated
 * to `max`. Pure, so the ordering and the cap can be unit tested.
 */
export function mergeHeroSlides(studioSlides, builtInSlides, max = MAX_HERO_SLIDES) {
  return [...studioSlides, ...builtInSlides].slice(0, max)
}
