import { useEffect, useState } from 'react'

export default function RoomModal({ room, onClose, onBookRoom }) {
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => { setActiveImg(0) }, [room])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const images = room.images?.length ? room.images : [room.img]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl rounded-sm">

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center border border-stone hover:border-primary text-ink/40 hover:text-primary transition-colors duration-200"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1l11 11M12 1L1 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* Left — Image gallery */}
          <div className="bg-mist p-5 lg:p-7">
            <div className="aspect-[4/3] overflow-hidden rounded-sm mb-4 bg-stone">
              <img
                key={activeImg}
                src={images[activeImg]}
                alt={room.title}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 overflow-hidden rounded-sm border-2 transition-all duration-200 ${
                      i === activeImg ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div className="p-8 lg:p-10 flex flex-col">

            <div className="mb-6">
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold mb-2">{room.tag}</p>
              <h2 className="font-serif text-3xl lg:text-4xl text-ink leading-tight">{room.title}</h2>
              <div className="w-10 h-px bg-gold mt-4 mb-3" />

              {/* Price — shown when available in Sanity */}
              {room.pricePerNight && (
                <div className="flex items-baseline gap-2 mb-4">
                  <p className="font-serif text-2xl text-primary">
                    KES {room.pricePerNight.toLocaleString()}
                  </p>
                  <p className="font-sans text-xs text-ink/40">per night</p>
                </div>
              )}

              <p className="font-sans font-light text-ink/60 text-sm leading-relaxed">
                {room.longDescription}
              </p>
            </div>

            {/* Amenities */}
            <div className="space-y-5 flex-1">
              {(room.amenities || []).map((group) => (
                <div key={group.label}>
                  <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-ink/35 mb-2.5">{group.label}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {(group.items || []).map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <span className="w-3 h-px bg-gold flex-shrink-0" />
                        <span className="font-sans text-xs text-ink/65">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-8 pt-6 border-t border-stone flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { onClose(); onBookRoom?.(room.id || room.tag?.toLowerCase().replace(/\s+/g, '-')) }}
                className="flex-1 text-center py-4 bg-primary text-white font-sans font-medium tracking-widest uppercase text-[10px] hover:bg-primary-dark transition-colors duration-200"
              >
                Book This Room
              </button>
              <a
                href={`https://wa.me/254714302777?text=Hello%2C%20I%27d%20like%20to%20enquire%20about%20the%20${encodeURIComponent(room.title)}%20at%20Hotel%20Itoya.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-4 border border-stone text-ink/55 font-sans font-medium tracking-widest uppercase text-[10px] hover:border-primary hover:text-primary transition-colors duration-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Enquiry
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
