// Generates src/season-art.css: the festive artwork as inline SVG data URIs held
// in CSS custom properties (--art-*), so the theme needs no image requests.
// Deterministic (seeded), so re-running it only changes the file when this
// script changes.   Run: node scripts/generate-season-art.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ---- tiny seeded PRNG so the foliage looks natural but never changes ----
let seed = 20261225
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
const between = (a, b) => a + rand() * (b - a)

const f = (n) => Number(n.toFixed(1))

// ---- garland geometry: a swag between two points at the top of a 240x64 tile ----
const W = 240, H = 64
const P0 = [0, 4], C = [120, 64], P1 = [240, 4]
const at = (t) => [
  (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t ** 2 * P1[0],
  (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t ** 2 * P1[1],
]
const tangent = (t) => {
  const dx = 2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P1[0] - C[0])
  const dy = 2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P1[1] - C[1])
  return Math.atan2(dy, dx)
}
const normal = (t) => tangent(t) + Math.PI / 2   // points below the swag

const GREENS = ['#17402a', '#1f5a3d', '#2a6b45', '#3b8257', '#4a9468']

function garlandFoliage() {
  const parts = []
  // base bough
  const pts = Array.from({ length: 41 }, (_, i) => at(i / 40).map(f).join(' ')).join(' L')
  parts.push(`<path d='M${pts}' fill='none' stroke='#123423' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'/>`)
  parts.push(`<path d='M${pts}' fill='none' stroke='#1f5a3d' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>`)
  // pine needles fanning out on both sides
  for (let t = 0; t <= 1.0001; t += 0.015) {
    const [x, y] = at(t)
    const a = tangent(t)
    for (const side of [-1, 1]) {
      const spread = between(0.5, 1.15) * side
      const ang = a + spread
      const len = between(6, 11.5)
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len
      const col = GREENS[Math.floor(rand() * GREENS.length)]
      parts.push(`<path d='M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}' stroke='${col}' stroke-width='1.5' stroke-linecap='round'/>`)
    }
  }
  return parts.join('')
}

function bauble(cx, cy, r, c1, c2, id) {
  return (
    `<defs><radialGradient id='${id}' cx='35%' cy='30%' r='75%'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></radialGradient></defs>` +
    `<rect x='${f(cx - 2.2)}' y='${f(cy - r - 3.2)}' width='4.4' height='3.6' rx='.8' fill='#e6c887' stroke='#a8863a' stroke-width='.5'/>` +
    `<circle cx='${cx}' cy='${cy}' r='${r}' fill='url(#${id})'/>` +
    `<ellipse cx='${f(cx - r * 0.35)}' cy='${f(cy - r * 0.4)}' rx='${f(r * 0.28)}' ry='${f(r * 0.18)}' fill='#fff' opacity='.55' transform='rotate(-30 ${f(cx - r * 0.35)} ${f(cy - r * 0.4)})'/>`
  )
}

function berries(t) {
  const [x, y] = at(t)
  const [nx, ny] = [Math.cos(normal(t)), Math.sin(normal(t))]
  const out = []
  for (const [dx, dy] of [[-3, 4], [2.5, 5], [0, 8.5]]) {
    const bx = x + nx * dy + Math.cos(tangent(t)) * dx, by = y + ny * dy + Math.sin(tangent(t)) * dx
    out.push(`<circle cx='${f(bx)}' cy='${f(by)}' r='2.6' fill='#b3261e'/><circle cx='${f(bx - 0.8)}' cy='${f(by - 0.9)}' r='.8' fill='#fff' opacity='.7'/>`)
  }
  return out.join('')
}

function garlandTile() {
  const dangle = (t, r, c1, c2, id, drop) => {
    const [x, y] = at(t)
    const cy = y + drop + r
    return `<path d='M${f(x)} ${f(y)}V${f(cy - r - 3)}' stroke='#e6c887' stroke-width='.8'/>` + bauble(f(x), f(cy), r, c1, c2, id)
  }
  const knot = (x) =>
    `<circle cx='${x}' cy='4' r='5.6' fill='#e6c887' stroke='#a8863a' stroke-width='.8'/>` +
    `<circle cx='${x}' cy='4' r='2.2' fill='#8a1c26'/>`
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>` +
    garlandFoliage() +
    berries(0.37) + berries(0.64) +
    dangle(0.2, 6.4, '#d6495a', '#6e131d', 'ga', 6) +
    dangle(0.5, 8.4, '#f7e3ab', '#b68a3a', 'gb', 7) +
    dangle(0.8, 6.4, '#d6495a', '#6e131d', 'gc', 6) +
    knot(0) + knot(W) +
    `</svg>`
  )
}

// Light bulbs that hang off the swag. `litParity` picks which bulbs are bright,
// so two layers with opposite parity, crossfaded, make the string twinkle.
const BULB = ['#ef4444', '#e6c887', '#7bd389', '#fff1cc']
function garlandLights(litParity) {
  const out = [`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>`]
  const ts = [0.08, 0.145, 0.28, 0.35, 0.43, 0.57, 0.65, 0.72, 0.855, 0.92]
  ts.forEach((t, i) => {
    const [x, y] = at(t)
    const [nx, ny] = [Math.cos(normal(t)), Math.sin(normal(t))]
    const bx = x + nx * 9, by = y + ny * 9 + 2
    const lit = i % 2 === litParity
    const col = BULB[i % BULB.length]
    out.push(`<path d='M${f(x)} ${f(y)}L${f(bx)} ${f(by - 3)}' stroke='#6b5d3f' stroke-width='.8'/>`)
    out.push(`<rect x='${f(bx - 1.2)}' y='${f(by - 4)}' width='2.4' height='3' rx='.6' fill='#6b5d3f'/>`)
    if (lit) out.push(`<circle cx='${f(bx)}' cy='${f(by + 1.5)}' r='6' fill='${col}' opacity='.30'/>`)
    out.push(`<ellipse cx='${f(bx)}' cy='${f(by + 1.5)}' rx='2.3' ry='3' fill='${col}' opacity='${lit ? 1 : 0.34}'/>`)
  })
  out.push('</svg>')
  return out.join('')
}

function hangingBauble(len, r, c1, c2, id) {
  const w = r * 2 + 8, h = len + r * 2 + 8
  const cx = w / 2, cy = len + r + 3
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<path d='M${cx} 0V${len - 1}' stroke='#c9b06b' stroke-width='1'/>` +
    bauble(cx, cy, r, c1, c2, id) +
    `<path d='M${f(cx - r)} ${f(cy + 0.5)}Q${cx} ${f(cy + r * 0.55)} ${f(cx + r)} ${f(cy + 0.5)}' fill='none' stroke='#e6c887' stroke-width='1.2' opacity='.85'/>` +
    `</svg>`
  )
}

function holly() {
  const leaf = (rot) =>
    `<g transform='rotate(${rot} 22 22)'>` +
    `<path d='M22 22C26 12 36 11 44 18C37 20 38 26 31 28C32 33 24 32 22 22Z' fill='#1f5a3d' stroke='#123423' stroke-width='.8'/>` +
    `<path d='M24 22C30 19 36 19 42 18' stroke='#4a9468' stroke-width='1' fill='none'/></g>`
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='40' viewBox='0 0 44 40'>` +
    leaf(-20) + leaf(52) +
    `<circle cx='16' cy='24' r='4.6' fill='#b3261e' stroke='#7a1812' stroke-width='.7'/><circle cx='14.6' cy='22.6' r='1.3' fill='#fff' opacity='.7'/>` +
    `<circle cx='23' cy='28' r='4.6' fill='#b3261e' stroke='#7a1812' stroke-width='.7'/><circle cx='21.6' cy='26.6' r='1.3' fill='#fff' opacity='.7'/>` +
    `<circle cx='21' cy='20' r='4.2' fill='#c8322a' stroke='#7a1812' stroke-width='.7'/><circle cx='19.8' cy='18.8' r='1.2' fill='#fff' opacity='.7'/>` +
    `</svg>`
  )
}

// Frosted-gold snowflake: a gold outline under white strokes stays visible on
// cream backgrounds and on photos alike.
function snowflake() {
  const arm = (rot) => {
    const g = (stroke, w) =>
      `<g transform='rotate(${rot} 12 12)' stroke='${stroke}' stroke-width='${w}' stroke-linecap='round' fill='none'>` +
      `<path d='M12 12V1.8M12 5.2L9.2 3M12 5.2L14.8 3M12 8.4L10 6.8M12 8.4L14 6.8'/></g>`
    return [g('#C7A56B', 3.4), g('#ffffff', 1.5)]
  }
  const arms = [0, 60, 120, 180, 240, 300].map(arm)
  return `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>${arms.map((a) => a[0]).join('')}${arms.map((a) => a[1]).join('')}</svg>`
}

// ---- emit CSS ----
const uri = (svg) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, ' ').replace(/%3D/g, '=').replace(/%3A/g, ':').replace(/%2F/g, '/').replace(/%2C/g, ',').replace(/%22/g, "'")}")`

const art = {
  garland: garlandTile(),
  'lights-a': garlandLights(0),
  'lights-b': garlandLights(1),
  'bauble-burgundy': hangingBauble(34, 12, '#d6495a', '#5a1119', 'hb1'),
  'bauble-gold': hangingBauble(64, 14, '#f7e3ab', '#a8863a', 'hb2'),
  'bauble-pine': hangingBauble(22, 10, '#4a9468', '#123d27', 'hb3'),
  holly: holly(),
  flake: snowflake(),
}

const css =
  `/* GENERATED by scripts/generate-season-art.mjs. Do not edit by hand. */\n` +
  `/* Festive artwork as inline SVG, so the theme costs no image requests. */\n` +
  `:root {\n` +
  Object.entries(art).map(([k, svg]) => `  --art-${k}: ${uri(svg)};`).join('\n') +
  `\n}\n`

fs.writeFileSync(path.join(root, 'src', 'season-art.css'), css)
const kb = (Buffer.byteLength(css) / 1024).toFixed(1)
console.log(`wrote src/season-art.css (${kb} kB) with ${Object.keys(art).length} pieces`)
for (const [k, svg] of Object.entries(art)) console.log(`  --art-${k.padEnd(16)} ${(Buffer.byteLength(svg) / 1024).toFixed(1)} kB`)
