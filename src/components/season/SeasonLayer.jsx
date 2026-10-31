import { Suspense, lazy } from 'react'
import { useSeason } from '../../lib/season'

// Only fetched while a season is running and the visitor has snow on, so the
// rest of the year it costs nothing.
const Snowfall = lazy(() => import('./Snowfall'))

export default function SeasonLayer() {
  const { active, snowOn, features } = useSeason()
  if (!active || !features.snow || !snowOn) return null

  return (
    <Suspense fallback={null}>
      <Snowfall />
    </Suspense>
  )
}
