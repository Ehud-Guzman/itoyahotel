// Canonical room prices — the server never trusts a client-supplied amount.
// Keep in sync with src/lib/rooms.js on the frontend (same ids/prices).
const ROOM_CATALOG = {
  'standard':      { label: 'Standard Room',     price: 3500 },
  'deluxe':        { label: 'Deluxe Room',       price: 6000 },
  'super-deluxe':  { label: 'Super Deluxe Room', price: 7000 },
  'executive':     { label: 'Executive Room',    price: 10000 },
}

module.exports = { ROOM_CATALOG }
