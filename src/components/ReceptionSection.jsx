export default function ReceptionSection() {
  return (
    <section id="reception" className="py-16 lg:py-24 bg-mist/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Intro */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-primary text-[11px] uppercase tracking-[0.3em] font-sans font-medium">
            Arrival Experience
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-ink mt-2">
            Reception &amp; Concierge
          </h2>
          <div className="w-20 h-[2px] bg-gold mx-auto mt-4" />
          <p className="text-ink/70 max-w-2xl mx-auto mt-4">
            From the moment you arrive, our team is dedicated to making your stay
            seamless, warm, and unforgettable.
          </p>
        </div>

        {/* Main Reception Feature */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/5 group">
          {/* Hero Image */}
          <div className="relative h-[320px] md:h-[420px] lg:h-[520px]">
            <img
              src="/images/reception/reception-2.webp"
              alt="Hotel Itoya Reception and Lobby"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          </div>

          {/* Floating Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12 text-white">
            <div className="max-w-3xl">
              <span className="inline-block bg-gold/90 text-ink text-[10px] uppercase tracking-[0.25em] font-semibold px-4 py-1.5 rounded-sm mb-4">
                Welcome to Hotel Itoya
              </span>
              <h3 className="font-serif text-2xl md:text-4xl lg:text-5xl leading-tight">
                A Warm Welcome
                <br />
                <span className="text-white/90">Awaits You</span>
              </h3>
              <p className="text-white/80 text-sm md:text-base max-w-xl mt-3 leading-relaxed">
                Our 24‑hour reception and dedicated concierge team are here to
                ensure every detail of your stay is taken care of — from check‑in
                to check‑out and everything in between.
              </p>
            </div>
          </div>

        
        </div>

        {/* Three Service Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-10">
          {/* Pillar 1: Check-in Experience */}
          <div className="bg-white rounded-xl p-6 lg:p-8 shadow-md shadow-black/5 border border-stone/100 hover:shadow-lg transition-shadow duration-300 group">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
              <span className="text-xl">🤝</span>
            </div>
            <h4 className="font-serif text-lg text-ink/90">Seamless Check‑in</h4>
            <p className="text-ink/70 text-sm mt-2 leading-relaxed">
              Express check‑in with a personal greeting. Our team ensures your
              arrival is effortless and welcoming.
            </p>
          </div>

          {/* Pillar 2: Concierge Services */}
          <div className="bg-white rounded-xl p-6 lg:p-8 shadow-md shadow-black/5 border border-stone/100 hover:shadow-lg transition-shadow duration-300 group">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
              <span className="text-xl">🏨</span>
            </div>
            <h4 className="font-serif text-lg text-ink/90">Dedicated Concierge</h4>
            <p className="text-ink/70 text-sm mt-2 leading-relaxed">
              From restaurant reservations to local tours — we handle the details
              so you can focus on enjoying your stay.
            </p>
          </div>

          {/* Pillar 3: Guest Services */}
          <div className="bg-white rounded-xl p-6 lg:p-8 shadow-md shadow-black/5 border border-stone/100 hover:shadow-lg transition-shadow duration-300 group">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
              <span className="text-xl">🎁</span>
            </div>
            <h4 className="font-serif text-lg text-ink/90">Personalised Services</h4>
            <p className="text-ink/70 text-sm mt-2 leading-relaxed">
              Luggage assistance, room preferences, special requests — our team
              anticipates your every need.
            </p>
          </div>
        </div>

  
      </div>
    </section>
  );
}