/* About Section — Hotel Itoya brand story and positioning */

const stats = [
  { value: '59', label: 'Rooms & Suites' },
  { value: '24/7', label: 'Reception & Service' },
  { value: 'Ayoti', label: 'Group Property' },
]

export default function AboutSection() {
  return (
    <section id="about" className="bg-cream py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left — Copy */}
          <div>
            <p className="section-label mb-4">About Hotel Itoya</p>
            <div className="gold-divider mb-8" />

            <h2 className="section-heading mb-8">
              Busia's Premier
              <br />
              <em>Hotel &amp; Event Venue</em>
            </h2>

            <p className="font-sans font-light text-ink/70 leading-relaxed text-base mb-6">
              Positioned in the heart of Busia — one of East Africa's busiest border
              towns — Hotel Itoya is the region's landmark hospitality destination.
              A proud property of the Ayoti Group, we blend professional standards
              with warm, genuine service that keeps guests returning.
            </p>

            <p className="font-sans font-light text-ink/70 leading-relaxed text-base mb-10">
              From 59 well-appointed rooms and versatile conference facilities to
              full-service dining and our partnership with Homeland Itoya Events,
              we are equipped to serve business travellers, corporate delegations,
              and event planners with equal care and precision.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 py-8 border-t border-b border-stone/60 mb-10">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-serif text-2xl text-primary font-medium">{s.value}</p>
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/60 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <a href="#rooms" className="btn-outline-dark">
                Explore Rooms
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center bg-primary text-white font-sans font-medium tracking-widest uppercase text-xs px-8 py-4 hover:bg-primary-dark transition-colors duration-200"
              >
                Make Enquiry
              </a>
            </div>
          </div>

          {/* Right — Image with floating stat card */}
          <div className="relative order-first lg:order-last">
            <div className="aspect-[5/6] rounded-md overflow-hidden img-placeholder">
              <img
                src="/images/exterior/hotel-exterior-1.webp"
                alt="Hotel Itoya exterior — Busia, Kenya"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Floating stat badge — anchored to bottom-left of image */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white shadow-xl flex flex-col items-center justify-center text-center px-4">
              <p className="font-serif text-3xl text-primary font-medium leading-none">59</p>
              <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-ink/70 mt-1">Rooms &amp; Suites</p>
              <div className="gold-divider w-8 my-2" />
              <p className="font-sans text-[9px] uppercase tracking-[0.24em] text-ink/70 leading-relaxed">
                Busia, Kenya
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
