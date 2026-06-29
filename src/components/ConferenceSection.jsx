/* Conference & Events — HIGH PRIORITY section, visually dominant */

const venues = [
  {
    img: '/images/conference/round-table-1.webp',
    capacity: 'Flexible Setup',
    title: 'Conference Hall',
    description:
      'Designed for business meetings, conferences, presentations, and professional gatherings in a refined environment.',
    features: [
      'Flexible Layout',
      'Presentation Ready',
      'Comfortable Seating',
      'Professional Environment',
    ],
  },

  {
    img: '/images/conference/conference-green-1.webp',
    capacity: 'Private Sessions',
    title: 'Executive Meeting Space',
    description:
      'An intimate setting for strategy sessions, workshops, and focused discussions.',

    features: [
      'Quiet Environment',
      'Presentation Support',
      'Refreshments Available',
      'Natural Lighting',
    ],
  },

  {
    img: '/images/dining/food-1.webp',
    capacity: 'Dining Experience',
    title: 'Culinary Celebrations',
    description:
      'Designed for exquisite dining experiences, bespoke catering, and memorable food-focused gatherings.',

    features: [
      'Seasonal Menus',
      'Custom Catering',
      'Farm-to-Table Ingredients',
      'Private Dining',
    ],
  },
]

const highlights = [
  { value: 'Flexible', label: 'Venue Options' },
  { value: 'Business', label: 'Focused Spaces' },
  { value: 'Events', label: 'Conference Support' },
  { value: 'Hospitality', label: 'Experience' },
]

export default function ConferenceSection() {
  return (
    <section id="conference" className="bg-gradient-to-b from-cream to-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Section header — editorial, strong */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-16">

          <div>
            <p className="section-label mb-4">
              Meetings & Events
            </p>

            <div className="gold-divider mb-8" />

            <h2 className="section-heading">
              Designed For Meetings
              <br />
              <em>That Matter</em>
            </h2>
          </div>

          <div className="lg:text-right">

            <p className="font-sans font-light text-ink/60 leading-relaxed mb-6 max-w-md ml-auto">
              Flexible spaces created for meetings, conferences, and memorable occasions —
              delivered with comfort, professionalism, and attention to detail.
            </p>

            <a
              href="#contact"
              className="inline-block border border-primary text-primary hover:bg-primary hover:text-white font-sans font-medium tracking-widest uppercase text-xs px-8 py-3.5 transition-colors duration-200"
            >
              Plan Your Event
            </a>

          </div>

        </div>

        {/* Stats bar — now using brown */}
        <div className="bg-primary mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {highlights.map((h) => (
              <div key={h.label} className="px-8 py-6 text-center">
                <p className="font-serif text-2xl md:text-3xl text-gold-light font-medium">{h.value}</p>
                <p className="font-sans text-xs text-white/60 tracking-wide mt-1">{h.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Venue cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {venues.map((venue, i) => (
            <div
              key={venue.title}
              className={`group relative overflow-hidden ${i === 0 ? 'lg:col-span-1' : ''}`}
            >
              {/* Image */}
              <div className="aspect-[16/10] overflow-hidden img-placeholder relative">
                <img
                  src={venue.img}
                  alt={venue.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-primary/30 group-hover:bg-primary/40 transition-colors duration-200" />

                {/* Capacity badge */}
                <div className="absolute top-4 right-4 bg-gold text-white font-sans text-xs tracking-widest uppercase px-3 py-1">
                  {venue.capacity}
                </div>
              </div>

              {/* Card content */}
              <div className="bg-white p-7 border border-stone border-t-0">
                <h3 className="font-serif text-xl text-ink font-medium mb-3">{venue.title}</h3>
                <p className="font-sans font-light text-ink/60 text-sm leading-relaxed mb-5">
                  {venue.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {venue.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3 font-sans text-xs text-ink/60">
                      <span className="w-3 h-px bg-gold flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className="font-sans font-medium tracking-widest uppercase text-xs border border-primary text-primary py-3 px-6 inline-block hover:bg-primary hover:text-white transition-colors duration-200"
                >
                  Enquire Now
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA strip — now using brown */}
        <div className="mt-12 bg-primary p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-serif text-xl md:text-2xl text-white font-medium mb-2">
              Planning a Corporate Event?
            </p>
            <p className="font-sans font-light text-white/70 text-sm">
              Our events team will handle every detail. Tell us about your requirements.
            </p>
          </div>
          <div className="flex gap-4 flex-shrink-0 flex-wrap justify-center md:justify-start">
            <a href="#contact" className="bg-gold text-white font-sans font-medium tracking-widest uppercase text-xs px-8 py-4 hover:bg-gold-dark transition-colors duration-200">
              Plan Your Event
            </a>
            <a
              href="https://wa.me/254714302777"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/30 text-white font-sans font-medium tracking-widest uppercase text-xs px-6 py-4 hover:border-white transition-colors duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}