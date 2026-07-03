import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

// Focuses the dialog on open, traps Tab within it, and restores focus to
// whatever triggered it on close — the baseline a11y contract for a modal.
export function useFocusTrap(active) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return
    const previouslyFocused = document.activeElement

    const focusables = () =>
      Array.from(container.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null)

    const first = focusables()[0]
    ;(first || container).focus?.()

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault(); lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault(); firstEl.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [active])

  return containerRef
}
