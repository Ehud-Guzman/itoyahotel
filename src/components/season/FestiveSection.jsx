import { LuBedDouble, LuUtensils, LuPartyPopper, LuArrowRight } from 'react-icons/lu'
import { srcSet } from '../../lib/responsive'
import { useSeason } from '../../lib/season'

// The festive season gets a real moment on the homepage, not just decoration:
// a warm invitation to stay, dine or celebrate, pointing at sections the site
// already has. Renders nothing outside a season (or when the visitor has the
// festive theme off), so it adds nothing to the page the rest of the year.

const DAY = 86_400_000

// Days until Christmas Day for a season that began in `year`; null once it has
// arrived (or is too far off to be worth showing).
function daysToChristmas(year) {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((new Date(year, 11, 25) - start) / DAY)
  return days >= 1 && days <= 60 ? days : null
}

const TILES = [
  {
    icon: LuBedDouble,
    title: 'Rest easy',
    text: 'Comfortable rooms with bed and breakfast included.',
    link: 'View rooms',
    href: '#rooms',
  },
  {
    icon: LuUtensils,
    title: 'Dine together',
    text: 'Share the season’s meals at our restaurant.',
    link: 'See dining',
    href: '#dining',
  },
  {
    icon: LuPartyPopper,
    title: 'Celebrate with us',
    text: 'Halls and event spaces for family gatherings and year-end parties, with outside catering by Homeland Itoya Events.',
    link: 'Plan a gathering',
    href: '#events',
  },
]

export default function FestiveSection({ onBookNow }) {
  const { active, copy, phase, year } = useSeason()
  if (!active || !copy) return null

  const days = phase === 'greeting' ? daysToChristmas(year) : null
  const pill =
    days !== null ? `${days} ${days === 1 ? 'day' : 'days'} to Christmas`
    : phase === 'christmas' ? 'Merry Christmas'
    : phase === 'newyear' ? `Happy New Year ${year + 1}`
    : null

  return (
    <section
      id="festive"
      aria-labelledby="festive-title"
      className="festive-section relative overflow-hidden bg-gradient-to-br from-[#3f0d14] via-[#5a1119] to-[#143d28] py-16 lg:py-24 text-white"
    >
      {/* Photo, faint on the right, so the section feels like the hotel and not a template */}
      <img
        src="/images/hero/lounge.webp"
        srcSet={srcSet('/images/hero/lounge.webp')}
        sizes="(min-width: 1024px) 50vw, 100vw"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-25 [mask-image:linear-gradient(to_left,black,transparent)] lg:block"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.3em] text-[#e6c887]">
            {copy.festive.eyebrow}
          </p>
          <h2 id="festive-title" className="mt-3 font-serif text-3xl leading-tight md:text-4xl lg:text-5xl">
            {copy.festive.title}
          </h2>
          <div className="mt-5 h-[2px] w-20 bg-[#e6c887]" />
          <p className="mt-5 max-w-xl font-sans text-sm leading-relaxed text-white/85 md:text-base">
            {copy.festive.body}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onBookNow}
              className="inline-flex items-center gap-2 bg-[#e6c887] px-7 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-[#3f0d14] transition-colors duration-200 hover:bg-white"
            >
              {copy.cta.label}
              <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {pill && (
              <span className="inline-flex items-center border border-[#e6c887]/60 px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#e6c887]">
                {pill}
              </span>
            )}
          </div>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-16">
          {TILES.map(({ icon: Icon, title, text, link, href }) => (
            <li key={title}>
              <a
                href={href}
                className="festive-tile group flex h-full flex-col border border-white/15 bg-white/5 p-6 backdrop-blur-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Icon className="h-6 w-6 text-[#e6c887]" aria-hidden="true" />
                <h3 className="mt-4 font-serif text-xl">{title}</h3>
                <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-white/80">{text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e6c887]">
                  {link}
                  <LuArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
