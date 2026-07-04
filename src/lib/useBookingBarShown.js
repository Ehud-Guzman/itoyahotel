import { useEffect, useRef, useState } from 'react'

// Booking bar visibility, shared between BookingBar and ChatBot so the chat
// button can sit just above the bar only while the bar is actually on screen.
//
// Rules: visible once scrolled past the hero, hidden near the footer. Through
// the intro sections (hero → about) it stays put; from the rooms section
// onwards it tucks away while scrolling down and reveals again on scroll up.
export default function useBookingBarShown() {
  const [visible,        setVisible]        = useState(false)
  const [hiddenByScroll, setHiddenByScroll] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      const nearFooter = currentY + window.innerHeight >= document.documentElement.scrollHeight - 220
      setVisible(currentY > 80 && !nearFooter)

      const roomsEl = document.getElementById('rooms')
      const beforeRooms = roomsEl
        ? roomsEl.getBoundingClientRect().top > window.innerHeight * 0.5
        : false

      const delta = currentY - lastScrollY.current
      if (beforeRooms) setHiddenByScroll(false)
      else if (delta > 4) setHiddenByScroll(true)
      else if (delta < -4) setHiddenByScroll(false)
      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { visible, hiddenByScroll, shown: visible && !hiddenByScroll }
}
