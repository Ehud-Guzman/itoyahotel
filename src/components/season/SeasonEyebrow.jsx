import { useSeason } from '../../lib/season'

// The season's greeting, carried past the announcement bar and the homepage
// moment so the whole site feels like the same hotel: a gold line with a sprig
// above a section heading, and a sign-off in the footer. One line only, no
// artwork — the decoration is already in the header. Renders nothing outside a
// season, so the rest of the year changes nothing.
//
// Styles: .season-eyebrow / .season-signoff in src/season.css.

export default function SeasonEyebrow({ className = '' }) {
  const { active, copy } = useSeason()
  if (!active || !copy?.hero) return null

  return (
    <p className={`season-eyebrow ${className}`.trim()}>
      <span>{copy.hero}</span>
    </p>
  )
}

export function SeasonSignoff() {
  const { active, copy } = useSeason()
  if (!active || !copy) return null

  return <p className="season-signoff">{copy.short}</p>
}
