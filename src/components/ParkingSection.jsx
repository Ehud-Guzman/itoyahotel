export default function ParkingSection() {
  return (
    <section id="parking" className="bg-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-8">
          <p className="section-label mb-2">Guest Services</p>
          <h3 className="section-heading">Convenient Parking & Valet</h3>
          <p className="text-ink/60 max-w-2xl mx-auto mt-4">
            Secure on-site parking with valet service available for events and
            overnight guests. Accessible bays and monitored parking ensure
            guest vehicles are kept safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="relative overflow-hidden rounded-lg bg-slate-50 shadow-sm">
            <img src="/parking1.jpeg" alt="Valet parking" className="w-full h-56 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-6 text-white">
                <h4 className="font-serif text-lg mb-1">Valet Service</h4>
                <p className="text-sm text-white/90">Door-to-door arrivals for events and check-in.</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg bg-slate-50 shadow-sm">
            <img src="/parking2.jpeg" alt="Secure parking" className="w-full h-56 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-6 text-white">
                <h4 className="font-serif text-lg mb-1">Secure Parking</h4>
                <p className="text-sm text-white/90">Gated, monitored parking with CCTV for peace of mind.</p>
              </div>
            </div>
          </div>

         
        </div>
      </div>
    </section>
  )
}
