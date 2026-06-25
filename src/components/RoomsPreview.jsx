/* Rooms Preview — refined premium accommodation */

const rooms = [
  {
    img: "/sitting1.jpeg",
    tag: "Comfort",
    title: "Standard Room",
    description:
      "Designed for comfortable stays with thoughtful details and a calm atmosphere for rest, productivity, and ease.",

    features: [
      "Comfortable Bedding",
      "Workspace",
      "Free Wi-Fi",
      "Modern Interior",
    ],
  },

  {
    img: "/beedroom1.webp",
    tag: "Featured",
    title: "Deluxe Room",

    description:
      "A more spacious accommodation experience offering additional comfort and flexibility for business and leisure stays.",

    features: [
      "Spacious Layout",
      "Seating Area",
      "Free Wi-Fi",
      "Enhanced Comfort",
    ],

    featured: true,
  },

  {
    img: "/conference2.webp",
    tag: "Premium",
    title: "Executive Room",

    description:
      "A refined stay experience designed for guests seeking elevated comfort and a relaxed atmosphere.",

    features: [
      "Premium Interior",
      "Business Friendly",
      "Work Area",
      "Comfort Focused",
    ],
  },
]

export default function RoomsPreview() {
  return (
    <section
      id="rooms"
      className="bg-mist py-24 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">

          <div>

            <p className="section-label mb-4">
              Accommodation
            </p>

            <div className="gold-divider mb-6" />

            <h2 className="section-heading">
              Rooms &
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

          {rooms.map((room) => (

            <div
              key={room.title}
              className={`
                group
                relative
                flex
                flex-col
                overflow-hidden
                rounded-md
                bg-white
                border
                border-stone/50
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-2xl
                ${
                  room.featured
                    ? "ring-1 ring-gold"
                    : ""
                }
              `}
            >

              {/* Badge */}

              <div className="absolute top-5 left-5 z-10">

                <span
                  className={`
                    px-3
                    py-1
                    uppercase
                    tracking-[0.2em]
                    text-[10px]
                    font-medium
                    rounded-sm
                    ${
                      room.featured
                        ? "bg-gold text-white"
                        : "bg-white/95 text-forest"
                    }
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
                  className="
                    w-full
                    h-full
                    object-cover
                    transition-transform
                    duration-700
                    group-hover:scale-105
                  "
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />

              </div>

              {/* Content */}

              <div className="flex flex-col flex-1 p-8">

                <h3 className="font-serif text-2xl text-ink mb-4">
                  {room.title}
                </h3>

                <p className="font-sans text-sm text-ink/60 leading-relaxed mb-7 flex-1">
                  {room.description}
                </p>

                {/* Features */}

                <div className="flex flex-wrap gap-2 mb-8">

                  {room.features.map((feature) => (

                    <span
                      key={feature}
                      className="
                        px-3
                        py-1
                        text-xs
                        border
                        border-stone
                        text-ink/60
                        rounded-sm
                      "
                    >
                      {feature}
                    </span>

                  ))}

                </div>

                {/* CTA */}

                <a
                  href="#contact"
                  className={`
                    text-center
                    py-4
                    uppercase
                    tracking-[0.2em]
                    text-xs
                    font-medium
                    transition-all
                    duration-300
                    ${
                      room.featured
                        ? "bg-gold text-white hover:bg-gold-dark"
                        : "border border-forest text-forest hover:bg-forest hover:text-white"
                    }
                  `}
                >
                  Explore Room
                </a>

              </div>

            </div>

          ))}

        </div>

      </div>
    </section>
  )
}