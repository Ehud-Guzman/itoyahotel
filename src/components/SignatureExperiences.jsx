/* Signature Experiences — refined premium hospitality */

const experiences = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    label: 'Accommodation',
    title: 'Comfortable Stays',
    description:
      'Thoughtfully designed rooms created for comfort, rest, and a refined hospitality experience.',
  },

  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    label: 'Events',
    title: 'Conference & Meetings',
    description:
      'Professional spaces designed for meetings, gatherings, and memorable business experiences.',
  },

  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      </svg>
    ),
    label: 'Dining',
    title: 'Dining Experience',
    description:
      'Enjoy welcoming spaces designed for memorable dining and relaxed hospitality.',
  },

  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78"/>
      </svg>
    ),
    label: 'Hospitality',
    title: 'Thoughtful Service',
    description:
      'A welcoming environment designed to make every stay smooth, comfortable, and enjoyable.',
  },
]

export default function SignatureExperiences() {
  return (
    <section className="bg-primary py-16 lg:py-24">

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}

        <div className="text-center max-w-2xl mx-auto mb-12">

          {/* Changed to white for clarity */}
          <p className="section-label text-white/80 mb-4">
            Experience Itoya
          </p>

          <div className="gold-divider mx-auto mb-8" />

          {/* Heading remains white */}
          <h2 className="section-heading-light mb-4 text-2xl md:text-3xl text-white">
            Signature <em className="text-gold-light not-italic">Experiences</em>
          </h2>

          <p className="text-white/60 leading-relaxed">
           Where Hospitality meets Value
          </p>

        </div>

        {/* Cards */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-md overflow-hidden">

          {experiences.map((exp) => (

            <div
              key={exp.title}
              className="group bg-primary p-6 hover:bg-primary-dark transition duration-300"
            >

              {/* Icon remains gold */}
              <div className="text-gold mb-5 group-hover:translate-x-1 transition-transform">
                {exp.icon}
              </div>

              {/* Label — changed to white/70 for better readability */}
              <p className="section-label text-white/70 mb-3">
                {exp.label}
              </p>

              <h3 className="font-serif text-white text-xl mb-4">
                {exp.title}
              </h3>

              <p className="text-white/60 text-sm leading-relaxed mb-6">
                {exp.description}
              </p>

              {/* Underline remains gold */}
              <div className="w-10 h-px bg-gold/50 group-hover:w-16 transition-all" />

            </div>

          ))}

        </div>

      </div>

    </section>
  )
}