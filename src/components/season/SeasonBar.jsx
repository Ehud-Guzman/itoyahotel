import { LuArrowRight, LuGift, LuPartyPopper, LuSnowflake, LuTreePine, LuX } from 'react-icons/lu'
import { closeBar, setSnow, useSeason } from '../../lib/season'

const icons = { tree: LuTreePine, gift: LuGift, party: LuPartyPopper }

// Slim festive strip at the top of the fixed header. It is always in the
// markup and season.css only gives it height while a season is running, so
// nothing about the layout changes the rest of the year.
export default function SeasonBar({ onBookNow }) {
  const { active, copy, barClosed, snowOn, features } = useSeason()
  const show = active && Boolean(copy) && !barClosed
  const Icon = copy ? (icons[copy.icon] ?? LuTreePine) : LuTreePine

  return (
    <div className="season-bar" {...(!show ? { 'aria-hidden': 'true', inert: '' } : {})}>
      {show && (
        <div className="season-bar__inner mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-10">
          <p className="flex min-w-0 flex-1 items-center justify-center gap-2.5 font-sans text-[11px] font-medium tracking-wide sm:text-xs">
            <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--season-gold)]" aria-hidden="true" />
            <span className="truncate sm:hidden">{copy.short}</span>
            <span className="hidden truncate sm:inline">{copy.text}</span>
            <button
              type="button"
              onClick={onBookNow}
              className="season-bar__cta hidden shrink-0 items-center gap-1.5 font-semibold uppercase tracking-[0.16em] text-[10px] underline-offset-4 hover:underline sm:inline-flex"
            >
              {copy.cta.label}
              <LuArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </p>

          <div className="flex shrink-0 items-center gap-0.5">
            {features.snow && (
              <button
                type="button"
                onClick={() => setSnow(!snowOn)}
                aria-pressed={snowOn}
                aria-label="Snowfall"
                title={snowOn ? 'Turn snow off' : 'Turn snow on'}
                className="season-bar__snow season-bar__btn"
                data-on={snowOn}
              >
                <LuSnowflake className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <button type="button" onClick={closeBar} aria-label="Dismiss message" className="season-bar__btn">
              <LuX className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
