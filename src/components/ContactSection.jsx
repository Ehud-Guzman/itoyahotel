/* Contact Section — polished premium contact experience */
import { useState } from 'react'

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'accommodation',
    message: '',
  })

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    alert(
      'Thank you for your enquiry. Our reservations team will contact you shortly.'
    )

    setFormData({
      name: '',
      email: '',
      phone: '',
      type: 'accommodation',
      message: '',
    })
  }

  return (
    <section
      id="contact"
      className="bg-gradient-to-b from-cream to-white py-24 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="section-label mb-4">
            Reservations & Enquiries
          </p>

          <div className="gold-divider mx-auto mb-8" />

          <h2 className="section-heading mb-6">
            Reserve Your Stay<br />
            <em>Or Plan Something Bigger</em>
          </h2>

          <p className="font-sans text-ink/60 leading-relaxed">
            Whether you're booking accommodation, organising an event,
            or planning a corporate stay — our team is ready to assist.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="overflow-hidden rounded-sm border border-stone shadow-sm grid grid-cols-1 lg:grid-cols-5">

          {/* LEFT */}
          <div className="lg:col-span-2 bg-forest p-10 lg:p-14 flex flex-col">

            <div>
              <p className="font-serif text-2xl text-white mb-10">
                Contact Information
              </p>

              <div className="space-y-8">

                <div>
                  <p className="text-gold text-xs tracking-widest uppercase mb-2">
                    Reservations
                  </p>

                  <a
                    href="tel:+254 765-50400"
                    className="block text-white hover:text-gold transition"
                  >
                    +254 765-50400
                  </a>

                  <a
                    href="tel:+254  765-50400"
                    className="block text-white/60 hover:text-gold transition"
                  >
                    +254  765-50400
                  </a>
                </div>

                <div>
                  <p className="text-gold text-xs tracking-widest uppercase mb-2">
                    Email
                  </p>

                  <a
                    href="mailto:reservations@hotelitoya.co.ke"
                    className="text-white hover:text-gold transition"
                  >
                    reservations@hotelitoya.co.ke
                  </a>
                </div>

                <div>
                  <p className="text-gold text-xs tracking-widest uppercase mb-2">
                    Location
                  </p>

                  <p className="text-white/80 leading-relaxed">
                    Town Centre Road<br />
                    Busia, Kenya
                  </p>

                  <p className="text-white/40 mt-2 text-sm">
                    Minutes from Busia Border Crossing
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="mt-14">

              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#1fb559]
                text-white uppercase tracking-widest
                text-xs font-medium py-4 flex justify-center"
              >
                WhatsApp Enquiry
              </a>

              <div className="mt-8 pt-8 border-t border-white/10">

                <p className="text-gold/60 text-xs uppercase tracking-widest mb-3">
                  Availability
                </p>

                <p className="text-white/60 text-sm leading-relaxed">
                  Reservations Team<br />
                  Daily · 7:00 AM – 10:00 PM
                </p>

                <p className="text-gold mt-3 text-sm">
                  Front Desk · 24 Hours
                </p>

              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="lg:col-span-3 bg-white p-10 lg:p-14">

            <h3 className="font-serif text-2xl text-ink mb-10">
              Send An Enquiry
            </h3>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              <div className="grid md:grid-cols-2 gap-5">

                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border border-stone bg-cream px-5 py-4 outline-none focus:border-gold"
                />

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="border border-stone bg-cream px-5 py-4 outline-none focus:border-gold"
                />

              </div>

              <div className="grid md:grid-cols-2 gap-5">

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border border-stone bg-cream px-5 py-4 outline-none focus:border-gold"
                />

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="border border-stone bg-cream px-5 py-4 outline-none focus:border-gold"
                >
                  <option value="accommodation">
                    Accommodation
                  </option>

                  <option value="conference">
                    Conference & Events
                  </option>

                  <option value="corporate">
                    Corporate Booking
                  </option>

                  <option value="other">
                    General Enquiry
                  </option>
                </select>

              </div>

              <textarea
                rows="7"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us about your stay, event, dates, number of guests, or requirements..."
                className="w-full border border-stone bg-cream px-5 py-4 resize-none outline-none focus:border-gold"
              />

              <button
                type="submit"
                className="
                w-full
                bg-gold
                hover:bg-gold-dark
                text-white
                uppercase
                tracking-widest
                text-xs
                py-5
                transition"
              >
                Send Enquiry
              </button>

            </form>
          </div>
        </div>

    

      </div>
    </section>
  )
}