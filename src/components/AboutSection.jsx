/* About Section — Hotel Itoya brand story and positioning */

const stats = [
  { value: '60+', label: 'Rooms & Suites' },
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
              From 60 well-appointed rooms and versatile conference facilities to
              full-service dining and our partnership with Homeland Itoya Events,
              we are equipped to serve business travellers, corporate delegations,
              and event planners with equal care and precision.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 py-8 border-t border-b border-stone/60 mb-10">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-serif text-2xl text-primary font-medium">{s.value}</p>
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/45 mt-1">{s.label}</p>
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

            {/* Floating stat card — anchored to bottom-left of image */}
            <div className="absolute bottom-6 left-6 bg-white px-6 py-5 shadow-xl max-w-[260px]">
              <div className="mb-4">
                <p className="font-serif text-4xl text-primary font-medium">60+</p>
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/65 mt-0.5">Rooms &amp; Suites</p>
              </div>
              <div className="gold-divider mb-3" />
              <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink/50 leading-relaxed">
                Busia, Kenya
                <br />
                An Ayoti Group Property
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
