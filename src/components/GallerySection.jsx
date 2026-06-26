/* Gallery — curated premium hospitality gallery with a livelier, masonry‑inspired layout */

const galleryImages = [
  {
    src: '/hotelitoyagpt1.png',
    alt: 'Hotel Exterior',
    span: 'md:col-span-2 row-span-2', // tall & wide hero
  },
  {
    src: '/lobby1.webp',
    alt: 'Lobby Experience',
    span: 'row-span-1',
  },
  {
    src: '/conference2.webp',
    alt: 'Conference Space',
    span: 'row-span-1',
  },
  {
    src: '/sitting1.jpeg',
    alt: 'Guest Rooms',
    span: 'md:col-span-2 row-span-1', // wide but shorter
  },
  {
    src: '/food1.webp',
    alt: 'Dining Experience',
    span: 'row-span-1',
  },
  {
    src: '/lounge1.webp',
    alt: 'Lounge Area',
    span: 'row-span-1',
  },
  {
    src: '/parking1.jpeg',
    alt: 'Parking Area',
    span: 'row-span-1',
  },
  
];

export default function GallerySection() {
  return (
    <section id="gallery" className="bg-mist py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header — tighter, cleaner spacing */}
        <div className="text-center mb-12">
          <p className="section-label mb-3">Visual Journey</p>
          <div className="gold-divider mx-auto mb-6" />
          <h2 className="section-heading mb-4">
            Discover
            <br />
            <em>Hotel Itoya</em>
          </h2>
          <p className="text-ink/60 max-w-xl mx-auto leading-relaxed">
            Explore spaces designed around comfort,
            hospitality, and memorable experiences.
          </p>
        </div>

        {/* Gallery — dynamic masonry grid with auto‑rows and custom spans */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 auto-rows-[280px] md:auto-rows-[320px]">

          {galleryImages.map((img, index) => (
            <div
              key={img.alt}
              className={`
                relative overflow-hidden rounded-2xl bg-slate-100 shadow-lg shadow-black/5 group
                transition-all duration-500 hover:shadow-2xl hover:shadow-black/10
                ${img.span}
                animate-fadeInUp
              `}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Overlay with smooth gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Caption — slides up on hover for a playful touch */}
              <div className="absolute inset-x-5 bottom-5 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <p className="font-serif text-xl md:text-2xl drop-shadow-lg">
                  {img.alt}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-white/80">
                  Photo preview
                </p>
              </div>
            </div>
          ))}

        </div>

        {/* Subtle fade‑in keyframes — add to your global CSS or Tailwind config */}
        <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease both;
          }
        `}</style>

      </div>
    </section>
  );
}