/* Location & How to Find Us */

const details = [
  {
    label: 'Address',
    value: 'Hotel Itoya, Busia Town, Busia County, Kenya',
  },
  {
    label: 'Phone',
    value: '+254 714 302 777',
    href: 'tel:+254714302777',
  },
  {
    label: 'Email',
    value: 'info@hotelitoya.co.ke',
    href: 'mailto:info@hotelitoya.co.ke',
  },
  {
    label: 'Border Crossing',
    value: '5 min from Busia–Uganda border',
  },
]

const directions = [
  { from: 'Nairobi', via: 'A104 via Nakuru & Eldoret', time: '~8–9 hrs' },
  { from: 'Kisumu',  via: 'A1 Busia Road',              time: '~3 hrs'   },
  { from: 'Kampala', via: 'A109 via Busia Border',       time: '~4 hrs 20 min' },
]

export default function LocationSection() {
  return (
    <section id="location" className="bg-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">Find Us</p>
          <div className="gold-divider mx-auto mb-6" />
          <h2 className="section-heading mb-4">
            How to Reach
            <br />
            <em>Hotel Itoya</em>
          </h2>
          <p className="font-sans font-light text-ink/55 max-w-md mx-auto text-sm leading-relaxed">
            Conveniently located in the heart of Busia — minutes from the Kenya–Uganda
            border crossing and accessible from all major routes.
          </p>
        </div>

        {/* Map + Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* Map embed — update src to exact hotel pin once confirmed on Google Maps */}
          <div className="lg:col-span-3 overflow-hidden rounded-sm border border-stone shadow-lg shadow-black/5 aspect-[16/10]">
            <iframe
              title="Hotel Itoya Location"
              src="https://maps.google.com/maps?q=-0.4612,34.1117&t=&z=17&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Contact details + directions */}
          <div className="lg:col-span-2 space-y-8">

            {/* Contact info */}
            <div>
              <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold mb-5">Contact & Address</p>
              <div className="space-y-4">
                {details.map((d) => (
                  <div key={d.label} className="flex gap-4">
                    <div className="w-px bg-gold/30 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-ink/35 mb-1">{d.label}</p>
                      {d.href ? (
                        <a
                          href={d.href}
                          className="font-sans text-sm text-ink/70 hover:text-primary transition-colors duration-200"
                        >
                          {d.value}
                        </a>
                      ) : (
                        <p className="font-sans text-sm text-ink/70">{d.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Directions */}
            <div>
              <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold mb-5">Getting Here</p>
              <div className="space-y-3">
                {directions.map((d) => (
                  <div key={d.from} className="bg-mist border-l-2 border-gold/40 pl-4 pr-4 py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-sans text-xs font-semibold text-ink/80 mb-0.5">From {d.from}</p>
                      <p className="font-sans text-[11px] text-ink/45">{d.via}</p>
                    </div>
                    <span className="font-sans text-xs font-medium text-primary whitespace-nowrap shrink-0">{d.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <a
              href="https://maps.google.com/?q=-0.4612,34.1117"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 border border-primary text-primary hover:bg-primary hover:text-white font-sans font-medium tracking-widest uppercase text-xs px-6 py-3.5 transition-colors duration-200 w-fit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Open in Google Maps
            </a>

          </div>
        </div>

      </div>
    </section>
  )
}
