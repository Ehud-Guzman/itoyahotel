/* Gallery — curated premium hospitality gallery */

const galleryImages = [
  {
    src: '/hotelitoyagpt1.png',
    alt: 'Hotel Exterior',
  },
  {
    src: '/lobby1.webp',
    alt: 'Lobby Experience',
  },
  {
    src: '/conference2.webp',
    alt: 'Conference Space',
  },
  {
    src: '/sitting1.jpeg',
    alt: 'Guest Rooms',
  },
  {
    src: '/food1.webp',
    alt: 'Dining Experience',
  },
  {
    src: '/events1.webp',
    alt: 'Events',
  },
]

export default function GallerySection() {
  return (
    <section
      id="gallery"
      className="bg-mist py-24 lg:py-32"
    >

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}

        <div className="text-center mb-16">

          <p className="section-label mb-4">
            Visual Journey
          </p>

          <div className="gold-divider mx-auto mb-8" />

          <h2 className="section-heading mb-5">
            Discover
            <br />
            <em>Hotel Itoya</em>
          </h2>

          <p className="text-ink/60 max-w-lg mx-auto leading-relaxed">
            Explore spaces designed around comfort,
            hospitality, and memorable experiences.
          </p>

        </div>

        {/* Gallery */}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          {galleryImages.map((img, i) => (

            <div
              key={i}
              className={`
                relative
                overflow-hidden
                rounded-md
                group
                ${
                  i === 0 || i === 3
                    ? 'aspect-[4/5]'
                    : 'aspect-[4/3]'
                }
              `}
            >

              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="
                  w-full
                  h-full
                  object-cover
                  transition-transform
                  duration-700
                  group-hover:scale-105
                "
              />

              {/* Overlay */}

              <div
                className="
                  absolute
                  inset-0
                  bg-black/0
                  group-hover:bg-black/25
                  transition
                "
              />

              {/* Label */}

              <div
                className="
                  absolute
                  left-6
                  bottom-6
                  text-white
                  opacity-0
                  translate-y-2
                  group-hover:opacity-100
                  group-hover:translate-y-0
                  transition
                "
              >

                <p className="font-serif text-xl">
                  {img.alt}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>
  )
}