/*
 * Generates responsive width variants for every webp under public/images
 * and writes a manifest consumed by src/lib/responsive.js.
 *
 * Run with: npm run images
 * Idempotent — skips variants that are newer than their source. Never
 * upscales: variants are only produced below the source's own width.
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('public/images')
const MANIFEST = path.resolve('src/lib/imageVariants.json')
const WIDTHS = [640, 960]
const QUALITY = 82

const files = []
;(function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.webp$/i.test(entry) && !/-\d+w\.webp$/i.test(entry)) files.push(p)
  }
})(ROOT)

const manifest = {}
let generated = 0

for (const file of files.sort()) {
  const meta = await sharp(file).metadata()
  const webPath = '/' + path.relative(path.resolve('public'), file).split(path.sep).join('/')
  const widths = WIDTHS.filter((w) => w < meta.width)
  manifest[webPath] = { w: meta.width, h: meta.height, widths }

  for (const w of widths) {
    const out = file.replace(/\.webp$/i, `-${w}w.webp`)
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(file).mtimeMs) continue
    await sharp(file)
      .resize({ width: w })
      .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
      .toFile(out)
    generated++
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`${files.length} source images, ${generated} variants written, manifest → src/lib/imageVariants.json`)
