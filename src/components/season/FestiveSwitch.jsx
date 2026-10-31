import { setFestive, useSeason } from '../../lib/season'

// Footer opt-out. Renders only while a season is running, and stays visible
// after switching off so the festive theme can be turned back on.
export default function FestiveSwitch() {
  const { available, active, features } = useSeason()
  if (!available) return null

  return (
    <button
      type="button"
      onClick={() => setFestive(!active)}
      aria-pressed={active}
      className="font-sans text-xs text-white/90 underline-offset-4 hover:text-gold hover:underline transition-colors duration-150"
    >
      {active ? 'Turn off' : 'Turn on'} {features.themeName ?? 'seasonal theme'}
    </button>
  )
}
