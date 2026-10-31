import { useEffect, useMemo, useState } from 'react'

// Gentle CSS snowfall. Every flake animates transform only, so it stays on the
// compositor and costs the main thread nothing. It is loaded lazily, only in
// season, waits for the browser to be idle so it can never touch LCP or input
// delay, and skips itself for people and devices that would not enjoy it.

const prefersCalm = () => {
  const connection = navigator.connection
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    connection?.saveData === true ||
    (navigator.deviceMemory !== undefined && navigator.deviceMemory < 2)
  )
}

const random = (min, max) => min + Math.random() * (max - min)

const makeFlakes = (count) =>
  Array.from({ length: count }, () => {
    const size = random(2.5, 6.8)
    // Bigger flakes are "closer": they fall faster, sway wider and look brighter.
    const depth = (size - 2.5) / 4.3
    return {
      near: size > 5.4,
      x: `${random(0, 100).toFixed(1)}%`,
      size: `${size.toFixed(1)}px`,
      duration: `${(random(20, 28) - depth * 12).toFixed(1)}s`,
      sway: `${random(2.4, 4.2).toFixed(1)}s`,
      delay: `${(-random(0, 26)).toFixed(1)}s`,
      drift: `${(14 + depth * 26 + random(0, 14)).toFixed(0)}px`,
      opacity: (0.4 + depth * 0.5).toFixed(2),
    }
  })

export default function Snowfall() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (prefersCalm()) return undefined

    const start = () => setReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 2500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(start, 1200)
    return () => window.clearTimeout(id)
  }, [])

  // Fewer flakes on phones. Generated once on the client.
  const flakes = useMemo(
    () => (ready ? makeFlakes(window.matchMedia('(max-width: 639px)').matches ? 16 : 30) : []),
    [ready],
  )

  if (!ready) return null

  return (
    <div className="snowfall" aria-hidden="true">
      {flakes.map((flake, index) => (
        <i
          key={index}
          className={flake.near ? 'near' : undefined}
          style={{
            '--x': flake.x,
            '--s': flake.size,
            '--d': flake.duration,
            '--sway': flake.sway,
            '--delay': flake.delay,
            '--dx': flake.drift,
            '--o': flake.opacity,
          }}
        />
      ))}
    </div>
  )
}
