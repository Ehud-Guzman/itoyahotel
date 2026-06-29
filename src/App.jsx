import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutSection from './components/AboutSection'
import SignatureExperiences from './components/SignatureExperiences'
import RoomsPreview from './components/RoomsPreview'
import DiningSection from './components/DiningSection'
import ConferenceSection from './components/ConferenceSection'
import EventsSection from './components/EventsSection'
import GallerySection from './components/GallerySection'
import Testimonials from './components/Testimonials'
import LocationSection from './components/LocationSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import ParkingSection from './components/ParkingSection'
import ChatBot from './components/ChatBot'
import ReceptionSection from './components/ReceptionSection'
import BookingModal from './components/BookingModal'

export default function App() {
  const [bookingOpen,     setBookingOpen]     = useState(false)
  const [preselectedRoom, setPreselectedRoom] = useState('')

  const openBooking = (roomId = '') => {
    setPreselectedRoom(roomId)
    setBookingOpen(true)
  }

  return (
    <>
      <Navbar onBookNow={() => openBooking()} />
      <main>
        <Hero onBookNow={() => openBooking()} />
        <ReceptionSection />
        <AboutSection />
        <RoomsPreview onBookRoom={openBooking} />
        <DiningSection />
        <ConferenceSection />
        <EventsSection />
        <SignatureExperiences />
        <GallerySection />
        <Testimonials />
        <LocationSection />
        <ParkingSection />
        <ContactSection />
        <ChatBot />
      </main>
      <Footer />

      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        preselectedRoom={preselectedRoom}
      />
    </>
  )
}
