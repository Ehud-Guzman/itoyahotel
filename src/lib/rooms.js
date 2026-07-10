// Single source of truth for the four fixed room types shown in the quick
// booking bar, room modal, and booking flow. Sanity-authored rooms (see
// RoomsPreview.jsx) can override description/imagery per room, but the
// booking flow itself only knows this fixed catalogue — keep prices here in
// sync with server/roomCatalog.js, which is the actual payment authority.
// maxGuests values are placeholders (2/3/3/4) — confirm actual per-room
// occupancy limits with the hotel and adjust before relying on this to
// reject overbooked rooms.
export const ROOM_CATALOG = [
  { id: 'standard',     tag: 'Standard',     label: 'Standard Room',     price: 3500,  maxGuests: 2, note: 'Bed & Breakfast included' },
  { id: 'deluxe',       tag: 'Deluxe',       label: 'Deluxe Room',       price: 6000,  maxGuests: 3, note: '' },
  { id: 'super-deluxe', tag: 'Super Deluxe', label: 'Super Deluxe Room', price: 7000,  maxGuests: 3, note: '' },
  { id: 'executive',    tag: 'Executive',    label: 'Executive Room',    price: 10000, maxGuests: 4, note: '' },
]

export function priceForTag(tag) {
  return ROOM_CATALOG.find((r) => r.tag === tag)?.price ?? null
}
