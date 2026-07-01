/* Contact Section — reservations & enquiries */
import { useState } from 'react'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  type: 'accommodation',
  checkin: '',
  checkout: '',
  guests: '',
  message: '',
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block">
        <span className="block font-sans text-[9px] uppercase tracking-[0.3em] text-ink/60 mb-2">{label}</span>
        {children}
      </label>
    </div>
  )
}

const inputClass =
  'w-full border border-stone bg-cream font-sans text-sm text-ink px-4 py-3.5 outline-none focus:border-gold transition-colors duration-200 placeholder:text-ink/30'

export default function ContactSection() {
  const [formData, setFormData] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // EmailJS integration goes here — configured next week
    setSubmitted(true)
  }

  return (
    <section id="contact" className="bg-gradient-to-b from-cream to-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="section-label mb-4">Reservations &amp; Enquiries</p>
          <div className="gold-divider mx-auto mb-8" />
          <h2 className="section-heading mb-6">
            Reserve Your Stay
            <br />
            <em>Or Plan Something Bigger</em>
          </h2>
          <p className="font-sans font-light text-ink/70 leading-relaxed text-sm">
            Whether you're booking accommodation, organising an event,
            or planning a corporate stay — our team is ready to assist.
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-sm border border-stone shadow-sm grid grid-cols-1 lg:grid-cols-5">

          {/* Left panel */}
          <div className="lg:col-span-2 bg-primary p-10 lg:p-12 flex flex-col gap-10">

            <div className="space-y-8">
              <p className="font-serif text-2xl text-white">Contact Information</p>

              <div>
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-white/90 mb-2">Phone</p>
                <a href="tel:+254714302777" className="block font-sans text-white hover:text-gold transition-colors duration-200">
                  +254 714 302 777
                </a>
                <a href="tel:+254714666222" className="block font-sans text-white/90 hover:text-gold transition-colors duration-200 mt-1">
                  +254 714 666 222
                </a>
              </div>

              <div>
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-white/90 mb-2">Email</p>
                <a href="mailto:info@hotelitoya.co.ke" className="font-sans text-white hover:text-gold transition-colors duration-200 break-all">
                  info@hotelitoya.co.ke
                </a>
              </div>

              <div>
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-white/90 mb-2">Location</p>
                <p className="font-sans text-white leading-relaxed text-sm">
                  Town Centre Road<br />
                  Busia, Kenya
                </p>
                <p className="font-sans text-white/90 text-xs mt-1.5">
                  Minutes from Busia Border Crossing
                </p>
              </div>

              <div>
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-white/90 mb-2">Hours</p>
                <p className="font-sans text-white text-sm">Reservations Team · Daily 7 AM – 10 PM</p>
                <p className="font-sans text-white text-sm mt-1">Front Desk · 24 Hours</p>
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href="https://wa.me/254714302777"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1fb559] text-white font-sans font-medium tracking-widest uppercase text-xs py-4 transition-colors duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>

          </div>

          {/* Right — form or success */}
          <div className="lg:col-span-3 bg-white p-10 lg:p-12">

            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mb-6">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl text-ink mb-3">Enquiry Received</h3>
                <p className="font-sans font-light text-ink/55 text-sm leading-relaxed max-w-xs mb-8">
                  Thank you. Our reservations team will get back to you within a few hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="font-sans text-xs uppercase tracking-widest text-primary border-b border-primary/30 hover:border-primary transition-colors duration-200 pb-0.5"
                >
                  Send another enquiry
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-2xl text-ink mb-8">Send an Enquiry</h3>

                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Full Name *">
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Email Address *">
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Phone Number">
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+254 700 000 000"
                        value={formData.phone}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Enquiry Type">
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="accommodation">Accommodation</option>
                        <option value="conference">Conference &amp; Meetings</option>
                        <option value="events">Events &amp; Occasions</option>
                        <option value="corporate">Corporate Booking</option>
                        <option value="dining">Dining Reservation</option>
                        <option value="other">General Enquiry</option>
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Field label="Check-in Date">
                      <input
                        type="date"
                        name="checkin"
                        value={formData.checkin}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Check-out Date">
                      <input
                        type="date"
                        name="checkout"
                        value={formData.checkout}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="No. of Guests">
                      <select
                        name="guests"
                        value={formData.guests}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        {['1', '2', '3', '4', '5', '6–10', '10+'].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Message">
                    <textarea
                      name="message"
                      rows={5}
                      placeholder="Tell us about your stay, requirements, or any special requests..."
                      value={formData.message}
                      onChange={handleChange}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white font-sans font-medium tracking-widest uppercase text-xs py-4 transition-colors duration-200"
                  >
                    Send Enquiry
                  </button>

                  <p className="font-sans text-[10px] text-ink/60 text-center">
                    We respond within a few hours · No payment required at this stage
                  </p>

                </form>
              </>
            )}

          </div>
        </div>

      </div>
    </section>
  )
}
