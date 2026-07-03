/* Testimonials — refined hospitality social proof, powered by Sanity CMS */
import { useSanity } from '../lib/sanity'

const TESTIMONIALS_QUERY = `*[_type == "testimonial" && active == true] | order(order asc, _createdAt desc) {
  _id, quote, guestName, role, rating, featured
}`

function initialsFor(name) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'
}

function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-1 mb-6">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={s <= count ? '#C7A56B' : '#C7A56B33'}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  const { data: testimonials } = useSanity(TESTIMONIALS_QUERY, null)

  // No testimonials published in Sanity yet — hide the section rather than
  // show fabricated-looking placeholder content.
  if (!testimonials?.length) return null

  return (
    <section className="bg-primary py-16 lg:py-24">

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}

        <div className="text-center max-w-2xl mx-auto mb-12">

          <p className="section-label text-white mb-3">
            Guest Experience
          </p>

          <div className="gold-divider mx-auto mb-6" />

          <h2 className="section-heading-light text-4xl md:text-5xl mb-5 text-white">
            Designed Around
            <br />
            <em className="text-white not-italic">Every Stay</em>
          </h2>

          <p className="text-white/90 leading-relaxed text-sm md:text-base">
            Hospitality experiences crafted to create comfort,
            trust, and memorable moments.
          </p>

        </div>

        {/* Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {testimonials.map((t) => (

            <div
              key={t._id}
              className={`
                p-6
                rounded-md
                border
                transition-all
                duration-300
                hover:-translate-y-1
                ${
                  t.featured
                    ? 'bg-white/15 border-gold/40'
                    : 'bg-white/5 border-white/10'
                }
              `}
            >

              <StarRating count={t.rating} />

              <div className="text-gold/50 text-5xl font-serif mb-3">
                "
              </div>

              <p className="text-white text-sm leading-relaxed mb-8">
                {t.quote}
              </p>

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">

                  <span className="text-white font-serif">
                    {initialsFor(t.guestName)}
                  </span>

                </div>

                <div>

                  <p className="text-white text-sm font-medium">
                    {t.guestName}
                  </p>

                  <p className="text-white/90 text-xs">
                    {t.role}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

        {/* Bottom strip */}

        <div className="mt-20 text-center">

          <div className="w-24 h-px bg-gold/30 mx-auto mb-6" />

          <p className="text-white/90 text-sm">
            Designed to inspire confidence,
            comfort, and memorable hospitality.
          </p>

        </div>

      </div>

    </section>
  )
}