/* About Section — refined premium hotel positioning */

export default function AboutSection() {
  const features = [
    'Premium Rooms',
    'Conference Facilities',
    'Dining Experience',
    'Business Friendly',
    'Comfort Focused',
    'Professional Service',
  ]

  return (
    <section id="about" className="bg-cream py-16 lg:py-20">

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left — Image */}
          <div className="relative">

            <div className="aspect-[5/6] rounded-md overflow-hidden">

              <img
                src="/hotelitoyagpt1.png"
                alt="Hotel interior"
                className="w-full h-full object-cover"
                loading="lazy"
              />

            </div>

            {/* Floating positioning card */}
            <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm px-6 py-5 shadow-lg max-w-[260px]">

              <p className="font-serif text-xl text-forest font-medium">
                Designed for Business & Comfort
              </p>

              <div className="gold-divider mt-3 mb-3" />

              <p className="font-sans text-xs text-ink/60 leading-relaxed">
                Premium accommodation, conferences and hospitality experiences.
              </p>

            </div>

          </div>

          {/* Right */}
          <div>

            <p className="section-label mb-4">
              About Hotel Itoya
            </p>

            <div className="gold-divider mb-8" />

            <h2 className="section-heading mb-8">
              Where Business Class
              <br />
              <em>Meets Genuine Warmth</em>
            </h2>

            <p className="font-sans font-light text-ink/70 leading-relaxed text-base mb-6">
              Thoughtfully designed for business travel, conferences,
              and comfortable stays, Hotel Itoya offers a refined
              hospitality experience in Busia.
            </p>

            <p className="font-sans font-light text-ink/70 leading-relaxed text-base mb-10">
              From elegant accommodation to professional event spaces,
              every experience is designed with comfort, reliability,
              and convenience in mind.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-6 mb-12">

              {features.map((item) => (

                <div
                  key={item}
                  className="flex items-center gap-3"
                >

                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />

                  <span className="font-sans text-sm text-ink/75">
                    {item}
                  </span>

                </div>

              ))}

            </div>

            <a
              href="#rooms"
              className="btn-outline-dark"
            >
              Discover Our Rooms
            </a>

          </div>

        </div>

      </div>

    </section>
  )
}