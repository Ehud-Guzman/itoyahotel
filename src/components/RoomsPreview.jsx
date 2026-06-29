/* Rooms grid — powered by Sanity CMS */
import { useState } from 'react'
import RoomModal from './RoomModal'
import { useSanity, imgUrl } from '../lib/sanity'

const ROOMS_QUERY = `*[_type == "room"] | order(order asc) {
  _id, title, tag, description, longDescription,
  pricePerNight, featured, features,
  "img":    images[0].asset->url,
  "images": images[].asset->url,
  amenities[] { label, items }
}`

const FALLBACK_ROOMS = [
  {
    img: '/images/rooms/standard-room-1.webp',
    tag: 'Standard',
    title: 'Standard Room',
    description: 'Designed for comfortable stays with thoughtful details and a calm atmosphere for rest, productivity, and ease.',
    longDescription: 'Our Standard Rooms are crafted for the guest who values simplicity done well. Clean lines, quality bedding, and a quiet environment make this the ideal base for business travellers and short-stay visitors exploring Busia. Everything you need — nothing you don\'t.',
    images: ['/images/rooms/standard-room-1.webp'],
    features: ['Comfortable Bedding', 'Workspace', 'Free Wi-Fi', 'Modern Interior'],
    amenities: [
      { label: 'Sleeping',  items: ['Queen Bed', 'Premium Mattress', 'Quality Linen', 'Blackout Curtains'] },
      { label: 'In-Room',   items: ['Flat-Screen TV', 'Free Wi-Fi', 'Air Conditioning', 'Work Desk & Chair'] },
      { label: 'Bathroom',  items: ['En-suite Bathroom', 'Hot & Cold Shower', 'Toiletries Provided', 'Towels & Robes'] },
      { label: 'Services',  items: ['Daily Housekeeping', 'Room Service', 'Wake-up Call', '24/7 Reception'] },
    ],
  },
  {
    img: '/images/rooms/deluxe-room-1.webp',
    tag: 'Deluxe',
    title: 'Deluxe Room',
    description: 'A more spacious accommodation experience offering additional comfort and flexibility for business and leisure stays.',
    longDescription: 'Step up to the Deluxe Room and enjoy noticeably more space, a dedicated lounge area, and enhanced in-room amenities. Popular with guests staying multiple nights, the Deluxe Room offers the breathing room and comfort that turns a trip into an experience.',
    images: ['/images/rooms/deluxe-room-1.webp'],
    features: ['Spacious Layout', 'Seating Area', 'Free Wi-Fi', 'Enhanced Comfort'],
    amenities: [
      { label: 'Sleeping',  items: ['King or Twin Beds', 'Premium Mattress', 'Luxury Linen', 'Blackout Curtains'] },
      { label: 'In-Room',   items: ['Large Flat-Screen TV', 'Free Wi-Fi', 'Air Conditioning', 'Mini Fridge'] },
      { label: 'Bathroom',  items: ['Spacious En-suite', 'Power Shower', 'Premium Toiletries', 'Bathrobe & Slippers'] },
      { label: 'Services',  items: ['Daily Housekeeping', 'Room Service', 'Concierge Access', '24/7 Reception'] },
    ],
  },
  {
    img: '/images/rooms/super-deluxe-room-1.webp',
    tag: 'Super Deluxe',
    title: 'Super Deluxe Room',
    description: 'The ultimate stay with generous space, luxurious finishing touches, and elevated amenities for an unforgettable retreat.',
    longDescription: 'The Super Deluxe Room represents the pinnacle of comfort at Hotel Itoya. A separate lounge area, king bed, panoramic views, and a suite of premium amenities make this the choice for guests who expect the very best — whether for a special occasion or a longer stay.',
    images: ['/images/rooms/super-deluxe-room-1.webp'],
    features: ['Private Lounge', 'King Bed', 'Panoramic Views', 'Premium Amenities'],
    amenities: [
      { label: 'Sleeping',  items: ['King Bed', 'Luxury Pillow Menu', 'Premium Linen', 'Separate Lounge Area'] },
      { label: 'In-Room',   items: ['55" Smart TV', 'High-Speed Wi-Fi', 'Climate Control', 'Minibar'] },
      { label: 'Bathroom',  items: ['Luxury En-suite', 'Rainfall Shower', 'Soaking Tub', 'Branded Toiletries'] },
      { label: 'Services',  items: ['Turndown Service', 'Priority Room Service', 'Express Check-in/out', 'Complimentary Breakfast'] },
    ],
  },
  {
    img: '/images/rooms/executive-room-1.webp',
    tag: 'Executive',
    title: 'Executive Room',
    description: 'A refined stay experience designed for guests seeking elevated comfort and a relaxed atmosphere.',
    longDescription: 'Purpose-built for the business traveller, the Executive Room combines a productive workspace with the comforts of a premium retreat. Designed to help you arrive rested, work efficiently, and leave feeling refreshed — every time.',
    images: ['/images/rooms/executive-room-1.webp'],
    features: ['Premium Interior', 'Business Friendly', 'Work Area', 'Comfort Focused'],
    amenities: [
      { label: 'Sleeping',  items: ['King Bed', 'Premium Mattress', 'Luxury Linen', 'Blackout Curtains'] },
      { label: 'In-Room',   items: ['Large Smart TV', 'High-Speed Wi-Fi', 'Air Conditioning', 'Executive Desk'] },
      { label: 'Bathroom',  items: ['Premium En-suite', 'Power Shower', 'Luxury Toiletries', 'Bathrobe & Slippers'] },
      { label: 'Services',  items: ['Business Center Access', 'Priority Room Service', 'Express Check-in/out', 'Daily Housekeeping'] },
    ],
  },
]

export default function RoomsPreview({ onBookRoom }) {
  // Empty fallback so we can merge smartly below
  const { data: sanityRaw } = useSanity(ROOMS_QUERY, [])
  const [selectedRoom, setSelectedRoom] = useState(null)

  const sanityRooms = sanityRaw || []

  // Keep fallback rooms whose title isn't already covered by a Sanity room
  const sanityTitles = new Set(sanityRooms.map((r) => r.title))
  const remainingFallbacks = FALLBACK_ROOMS.filter((r) => !sanityTitles.has(r.title))

  const rooms = [...sanityRooms, ...remainingFallbacks].map((r) => ({
    ...r,
    img:    imgUrl(r.img,  600, 450),
    images: (r.images || [r.img]).map((u) => imgUrl(u, 900)),
  }))

  return (
    <>
      <section id="rooms" className="bg-mist py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <p className="section-label mb-4">Accommodation</p>
              <div className="gold-divider mb-6" />
              <h2 className="section-heading">
                Rooms &amp;
                <br />
                <em>Stays</em>
              </h2>
            </div>
            <p className="font-sans font-light text-ink/60 max-w-md text-sm leading-relaxed md:text-right">
              Spaces thoughtfully designed around comfort,
              convenience, and a refined hospitality experience.
            </p>
          </div>

          {/* Room Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <div
                key={room._id || room.title}
                className={`
                  group relative flex flex-col overflow-hidden rounded-md bg-white
                  border border-stone/50 transition-all duration-300
                  hover:-translate-y-1 hover:shadow-2xl
                  ${room.featured ? 'ring-1 ring-gold' : ''}
                `}
              >
                {/* Badge */}
                <div className="absolute top-5 left-5 z-10">
                  <span
                    className={`
                      px-3 py-1 uppercase tracking-[0.2em] text-[10px] font-medium rounded-sm
                      ${room.featured ? 'bg-gold text-white' : 'bg-white/95 text-primary'}
                    `}
                  >
                    {room.tag}
                  </span>
                </div>

                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={room.img}
                    alt={room.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-8">
                  <h3 className="font-serif text-2xl text-ink mb-3">{room.title}</h3>

                  {/* Price — only shown when set in Sanity */}
                  {room.pricePerNight && (
                    <p className="font-sans text-sm font-semibold text-primary mb-3">
                      KES {room.pricePerNight.toLocaleString()}
                      <span className="font-normal text-ink/40 ml-1">/ night</span>
                    </p>
                  )}

                  <p className="font-sans text-sm text-ink/60 leading-relaxed mb-7 flex-1">
                    {room.description}
                  </p>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {(room.features || []).map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 text-xs border border-stone text-ink/60 rounded-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => setSelectedRoom(room)}
                    className={`
                      text-center py-4 uppercase tracking-[0.2em] text-xs font-medium
                      transition-all duration-300 cursor-pointer
                      ${room.featured
                        ? 'bg-gold text-white hover:bg-gold-dark'
                        : 'border border-primary text-primary hover:bg-primary hover:text-white'
                      }
                    `}
                  >
                    Explore Room
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {selectedRoom && (
        <RoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} onBookRoom={onBookRoom} />
      )}
    </>
  )
}
