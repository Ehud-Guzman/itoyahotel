const LAST_UPDATED = 'July 24, 2026'

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-lg text-ink mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-ink/70 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-primary px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-[10px] tracking-[0.3em] uppercase text-white/70 hover:text-white transition-colors">
            ← Back to Hotel Itoya
          </a>
          <h1 className="font-serif text-2xl md:text-3xl text-white mt-3">Privacy Policy</h1>
          <p className="text-white/70 text-xs mt-2">Last updated {LAST_UPDATED}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-sm text-ink/70 leading-relaxed mb-10">
          This policy explains what personal information Hotel Itoya (operated by Ayoti Group,
          B1 Kisumu-Busia Road, Busia, Kenya) collects through this website, why we collect it,
          and how it's handled. It applies to our booking form, contact form, and admin systems.
        </p>

        <Section title="What we collect">
          <p><strong className="text-ink">When you make a reservation:</strong> full name, phone number,
          email address, check-in/check-out dates, number of guests, any special requests you enter,
          and a photo or scan of both sides of a government-issued ID.</p>
          <p><strong className="text-ink">When you pay online:</strong> the M-Pesa phone number you provide,
          used to send a payment prompt via Safaricom. We do not see or store your M-Pesa PIN.</p>
          <p><strong className="text-ink">When you send us an enquiry:</strong> your name, email, phone
          number, and the contents of your message.</p>
        </Section>

        <Section title="Why we collect it">
          <p>ID verification is required by Kenyan hotel regulations for guest registration. The rest
          is used to process your reservation, confirm and coordinate your stay, process payment, and
          respond to enquiries. We don't use your information for marketing without your separate consent.</p>
        </Section>

        <Section title="Who can see it">
          <p>Booking and enquiry details are visible to authorized Hotel Itoya staff through a
          password-protected admin system. Your information also passes through the service providers
          that operate this site on our behalf — hosting, database, and email delivery providers, and
          Safaricom for M-Pesa payments. These providers only process data to keep the site and booking
          system running; we don't sell your information to anyone.</p>
        </Section>

        <Section title="How it's protected">
          <p>Data is transmitted over HTTPS. The admin system requires a staff password and expires
          sessions automatically. ID documents are only viewable by logged-in staff.</p>
        </Section>

        <Section title="How long we keep it">
          <p>We retain booking records, including ID documents, for as long as reasonably necessary to
          fulfil your stay and meet our legal and regulatory record-keeping obligations, after which
          it's deleted. If you'd like your data removed sooner, contact us using the details below and
          we'll do so unless we're required to retain it by law.</p>
        </Section>

        <Section title="Your rights">
          <p>Under Kenya's Data Protection Act, 2019, you can ask us to access, correct, or delete the
          personal information we hold about you, or object to how it's used. To make a request, email{' '}
          <a href="mailto:hotel.itoya@ayotigroup.com" className="text-primary hover:text-primary-dark underline">
            hotel.itoya@ayotigroup.com
          </a>.</p>
        </Section>

        <Section title="Cookies & tracking">
          <p>This website does not currently use analytics or advertising cookies. If that changes,
          this policy will be updated.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about this policy or your data can be sent to{' '}
          <a href="mailto:hotel.itoya@ayotigroup.com" className="text-primary hover:text-primary-dark underline">
            hotel.itoya@ayotigroup.com
          </a>{' '}or call{' '}
          <a href="tel:+254714302777" className="text-primary hover:text-primary-dark underline">+254 714 302 777</a>,{' '}
          <a href="tel:+254714666222" className="text-primary hover:text-primary-dark underline">+254 714 666 222</a>, or{' '}
          <a href="tel:+254714777333" className="text-primary hover:text-primary-dark underline">+254 714 777 333</a>.</p>
        </Section>
      </main>
    </div>
  )
}
