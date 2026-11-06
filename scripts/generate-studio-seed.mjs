// Writes studio/seed.ndjson: the starting content for the hotel's Studio, built
// from the site's built-in values so what the client sees on first opening is
// exactly what the website already shows.
//
//   node scripts/generate-studio-seed.mjs
//   cd studio && npx sanity dataset import seed.ndjson production --missing
//
// `--missing` imports only documents that do not exist yet, so it can never
// overwrite something the client has already edited. Re-running it is safe.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_ROOMS, DEFAULT_SETTINGS } from '../src/lib/hotelData.js'

export function buildSeed() {
  const docs = [
    { _id: 'siteSettings', _type: 'siteSettings', ...DEFAULT_SETTINGS },
    ...DEFAULT_ROOMS.map((r, i) => ({
      _id: `room-${r.id}`,
      _type: 'room',
      roomType: r.id,
      title: r.label,
      tag: r.tag,
      pricePerNight: r.price,
      priceNote: r.note,
      maxGuests: r.maxGuests,
      available: r.available,
      order: i + 1,
      // No description / photos on purpose: the site keeps its built-in ones until
      // the hotel adds its own, so importing this changes nothing visible.
    })),
  ]
  return docs.map((d) => JSON.stringify(d)).join('\n') + '\n'
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'studio', 'seed.ndjson')
  fs.writeFileSync(out, buildSeed())
  console.log(`wrote ${out} (${buildSeed().trim().split('\n').length} documents)`)
}
