import { useState } from 'react';
export default function ParkingSection() {
  // --- Image Arrays (for thumbnails) ---
  const parkingImages = ['/images/parking/parking-1.webp', '/images/parking/parking-2.webp'];
  const kitchenImages = [
    '/images/events/mobile-kitchen-equipment.webp',
    '/images/events/mobile-kitchen-interior.webp',
    '/images/events/mobile-kitchen-exterior.webp',
  ];
  const kitchenThumbs = [
    '/images/events/mobile-kitchen-equipment-thumb.webp',
    '/images/events/mobile-kitchen-interior-thumb.webp',
    '/images/events/mobile-kitchen-exterior-thumb.webp',
  ];

  const [parkingIndex, setParkingIndex] = useState(0);
  const [kitchenIndex, setKitchenIndex] = useState(0);

  return (
    <section id="parking" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Intro */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-gold text-[11px] uppercase tracking-[0.3em] font-sans font-medium">
            Guest Services
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-ink mt-2">
            Parking &amp; Mobile Kitchen
          </h2>
          <div className="w-20 h-[2px] bg-gold mx-auto mt-4" />
        </div>

        {/* --- ROW 1: PARKING & VALET --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-2xl overflow-hidden shadow-2xl shadow-black/5 border border-stone/100 mb-8 lg:mb-12">
          {/* Left: Image (static, with thumbnails below) */}
          <div className="bg-black/5 p-4">
            <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
              <img
                src={parkingImages[parkingIndex]}
                alt="Parking"
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
              />
            </div>
            {/* Thumbnail strip */}
            <div className="flex gap-2 mt-3 justify-center">
              {parkingImages.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setParkingIndex(idx)}
                  className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                    idx === parkingIndex ? 'border-gold' : 'border-transparent'
                  }`}
                >
                  <img src={src} alt={`Thumb ${idx}`} className="w-full h-full object-cover" loading="lazy" width="56" height="56" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex flex-col justify-center p-8 lg:p-12 xl:p-16">
            <span className="text-gold text-[11px] uppercase tracking-[0.3em] font-sans font-medium">
              Parking &amp; Valet
            </span>
            <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-ink leading-tight mt-2">
              Effortless Arrivals
            </h3>
            <div className="w-12 h-[2px] bg-gold mt-4 mb-6" />
            <p className="text-ink/70 text-base leading-relaxed max-w-lg">
              Secure, gated parking with professional valet service. Arrive in
              style and leave the rest to us — monitored 24/7 for your peace of mind.
            </p>
            <ul className="mt-6 space-y-2.5">
              <li className="flex items-center gap-3 text-ink/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                Valet Service Available
              </li>
              <li className="flex items-center gap-3 text-ink/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                24/7 CCTV Monitoring
              </li>
              <li className="flex items-center gap-3 text-ink/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                Dedicated Guest Spaces
              </li>
            </ul>
            <a
              href="#contact"
              className="inline-block mt-8 font-sans text-[11px] uppercase tracking-[0.25em] text-gold hover:text-gold-dark border-b border-gold/30 hover:border-gold transition-colors pb-1"
            >
              Enquire about parking →
            </a>
          </div>
        </div>

        {/* --- ROW 2: MOBILE KITCHEN --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-2xl overflow-hidden shadow-2xl shadow-black/5 border border-stone/100">
          {/* Left: Content */}
          <div className="flex flex-col justify-center p-8 lg:p-12 xl:p-16 order-2 md:order-1">
            <span className="text-gold text-[11px] uppercase tracking-[0.3em] font-sans font-medium">
              Culinary Excellence
            </span>
            <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-ink leading-tight mt-2">
              Mobile Kitchen &amp; <br />Outdoor Catering
            </h3>
            <div className="w-12 h-[2px] bg-gold mt-4 mb-6" />
            <p className="text-ink/70 text-base leading-relaxed max-w-lg">
              Our state‑of‑the‑art mobile kitchen brings the authentic Hotel
              Itoya dining experience directly to your event, wherever it may be.
            </p>
            <ul className="mt-6 space-y-2.5">
              <li className="flex items-center gap-3 text-ink/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                On‑site Cooking
              </li>
              <li className="flex items-center gap-3 text-ink/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                Custom Menu Design
              </li>
              <li className="flex items-center gap-3 text-ink/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                Fully Equipped &amp; Staffed
              </li>
            </ul>
            <a
              href="#contact"
              className="inline-block mt-8 font-sans text-[11px] uppercase tracking-[0.25em] text-gold hover:text-gold-dark border-b border-gold/30 hover:border-gold transition-colors pb-1"
            >
              Explore catering options →
            </a>
          </div>

          {/* Right: Image */}
          <div className="bg-black/5 p-4 order-1 md:order-2">
            <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
              <img
                src={kitchenImages[kitchenIndex]}
                alt="Mobile kitchen"
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
              />
            </div>
            {/* Thumbnail strip */}
            <div className="flex gap-2 mt-3 justify-center">
              {kitchenImages.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setKitchenIndex(idx)}
                  className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                    idx === kitchenIndex ? 'border-gold' : 'border-transparent'
                  }`}
                >
                  <img src={kitchenThumbs[idx]} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" width="56" height="56" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}