/* Events & Homeland Itoya — with upcoming special events from Sanity CMS */
import { useSanity, imgUrl } from '../lib/sanity'

const EVENTS_QUERY = `*[_type == "specialEvent" && active == true] | order(date asc) {
  _id, title, date, description, category,
  "image": image.asset->url
}`

const eventTypes = [
  { title: 'Wedding Receptions',    desc: 'Elegant setups for your most important day, handled with care.' },
  { title: 'Corporate Gatherings',  desc: 'Large-scale outdoor events with full catering support.' },
  { title: 'Outside Catering',      desc: 'Our mobile kitchen brings Hotel Itoya quality to your venue.' },
  { title: 'Cultural Celebrations', desc: 'Traditional and modern event setups to mark any occasion.' },
]

const CATEGORY_COLOURS = {
  Wedding:   'bg-gold text-white',
  Corporate: 'bg-primary text-white',
  Cultural:  'bg-ink text-gold',
  Catering:  'bg-white/20 text-white',
  Other:     'bg-white/20 text-white',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function EventsSection() {
  const { data: specialEvents } = useSanity(EVENTS_QUERY, null)

  return (
    <section id="events" className="bg-ink py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-16">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold mb-4">Events & Outside Catering</p>
            <div className="w-10 h-px bg-gold mb-8" />
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-light leading-[1.1]">
              Events That
              <br />
              <em className="text-gold-light">Leave a Mark</em>
            </h2>
          </div>
          <div className="lg:text-right">
            {/* Homeland Itoya logo lockup */}
            <div className="inline-flex flex-col items-start lg:items-end gap-3 mb-6">
              <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-white/40">In partnership with</p>
              <div className="flex items-center gap-3">
                <div className="bg-white/95 rounded-full p-2 border border-white/20 shadow-lg">
                  <img
                    src="/logos/homeland-logo.png"
                    alt="Homeland Itoya"
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <div className="text-left">
                  <p className="font-serif text-white text-lg">Homeland Itoya</p>
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold/70">Events &amp; Catering</p>
                </div>
              </div>
            </div>
            <p className="font-sans font-light text-white/55 leading-relaxed mb-6 max-w-md lg:ml-auto text-sm">
              Through our partnership with Homeland Itoya Events, we bring world-class
              outside catering and event management to any location — from intimate
              gatherings to grand celebrations.
            </p>
            <div className="flex gap-3 flex-wrap justify-start lg:justify-end">
              <a
                href="#contact"
                className="inline-block bg-gold text-white font-sans font-medium tracking-widest uppercase text-xs px-7 py-3.5 hover:bg-gold-dark transition-colors duration-200"
              >
                Plan an Event
              </a>
              <a
                href="https://wa.me/254714302777"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-sans font-medium tracking-widest uppercase text-xs px-6 py-3.5 hover:border-gold hover:text-gold transition-colors duration-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ── Upcoming Special Events — only shows when data exists in Sanity ── */}
        {specialEvents?.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-6 h-px bg-gold" />
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold">Upcoming Events</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialEvents.map((event) => (
                <div
                  key={event._id}
                  className="relative overflow-hidden rounded-sm group cursor-default"
                >
                  {/* Event photo */}
                  {event.image ? (
                    <img
                      src={imgUrl(event.image, 700, 440)}
                      alt={event.title}
                      loading="lazy"
                      className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-56 bg-white/5" />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    {event.category && (
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] rounded-sm mb-2.5 ${CATEGORY_COLOURS[event.category] || 'bg-white/20 text-white'}`}>
                        {event.category}
                      </span>
                    )}
                    <p className="font-serif text-lg text-white leading-snug mb-1.5">
                      {event.title}
                    </p>
                    {event.date && (
                      <p className="font-sans text-xs text-gold-light tracking-wide">
                        {formatDate(event.date)}
                      </p>
                    )}
                    {event.description && (
                      <p className="font-sans text-xs text-white/60 leading-relaxed mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[220px] gap-3 mb-12">

          {/* Hero image — full height left half */}
          <div className="col-span-2 md:row-span-2 relative overflow-hidden rounded-sm img-placeholder group">
            <img
              src="/images/events/homeland-1.webp"
              alt="Homeland Itoya Event"
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
          </div>

          {[
            { src: '/images/events/events-1.webp',       alt: 'Event Setup' },
            { src: '/images/events/homeland-setup.webp', alt: 'Homeland Setup' },
            { src: '/images/events/events-2.webp',       alt: 'Outdoor Event' },
            { src: '/images/events/events-3.webp',       alt: 'Catering Event' },
          ].map((img) => (
            <div
              key={img.alt}
              className="relative overflow-hidden rounded-sm img-placeholder group"
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
          ))}
        </div>

        {/* Event types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          {eventTypes.map((e) => (
            <div key={e.title} className="bg-ink p-8 hover:bg-white/5 transition-colors duration-200">
              <div className="w-6 h-px bg-gold mb-5" />
              <p className="font-serif text-lg text-white mb-3">{e.title}</p>
              <p className="font-sans text-xs text-white/50 leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
