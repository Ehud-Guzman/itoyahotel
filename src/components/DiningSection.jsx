/* Dining & Restaurant section — with live menu from Sanity CMS */
import { useState } from 'react'
import { useSanity, imgUrl } from '../lib/sanity'

const MENU_QUERY = `*[_type == "menuItem" && available == true] | order(category asc, order asc) {
  _id, name, description, price, category,
  "image": image.asset->url
}`

const highlights = [
  { icon: '☀', label: 'Breakfast',      desc: 'Start your morning right with a hearty, freshly prepared spread.' },
  { icon: '🍽', label: 'Lunch & Dinner', desc: 'À la carte dining with local and continental flavours.' },
  { icon: '🛎', label: 'Room Service',   desc: 'In-room dining available for guests at any hour.' },
  { icon: '🥂', label: 'Private Dining', desc: 'Exclusive table settings for special occasions.' },
]

const CATEGORY_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts']

export default function DiningSection() {
  const { data: menuItems } = useSanity(MENU_QUERY, null)
  const [activeMenuCat, setActiveMenuCat] = useState(null)

  // Derive categories present in the current menu data, in a logical meal order
  const menuCategories = menuItems
    ? CATEGORY_ORDER.filter((c) => menuItems.some((i) => i.category === c))
    : []

  const resolvedCat   = activeMenuCat && menuCategories.includes(activeMenuCat)
    ? activeMenuCat
    : menuCategories[0] ?? null

  const visibleItems = menuItems
    ? menuItems.filter((i) => i.category === resolvedCat)
    : []

  return (
    <section id="dining" className="bg-cream py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-16">
          <div>
            <p className="section-label mb-4">Culinary Experience</p>
            <div className="gold-divider mb-8" />
            <h2 className="section-heading">
              Dining at
              <br />
              <em>Hotel Itoya</em>
            </h2>
          </div>
          <div className="lg:text-right">
            <p className="font-sans font-light text-ink/60 leading-relaxed mb-6 max-w-md ml-auto">
              Our kitchen brings together fresh, local ingredients and skilled preparation
              to deliver a dining experience that is warm, satisfying, and memorable — for
              every guest, every visit.
            </p>
            <a
              href="#contact"
              className="inline-block border border-primary text-primary hover:bg-primary hover:text-white font-sans font-medium tracking-widest uppercase text-xs px-8 py-3.5 transition-colors duration-200"
            >
              Reserve a Table
            </a>
          </div>
        </div>

        {/* Main visual — split */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">

          {/* Large restaurant image */}
          <div className="lg:col-span-3 relative overflow-hidden rounded-sm aspect-[16/10] lg:aspect-auto lg:min-h-[440px] img-placeholder">
            <img
              src="/images/dining/restaurant-1.webp"
              alt="Hotel Itoya Restaurant"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-7">
              <p className="font-serif text-2xl text-white mb-1">The Restaurant</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold-light">Open Daily · All Guests Welcome</p>
            </div>
          </div>

          {/* Food image + hours card */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-sm flex-1 aspect-[4/3] lg:aspect-auto img-placeholder">
              <img
                src="/images/dining/food-1.webp"
                alt="Freshly Prepared Cuisine"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-serif text-xl text-white">Fresh, Local, Crafted</p>
                <p className="font-sans text-xs text-white/70 mt-1 leading-relaxed">
                  Every dish prepared with care using quality local produce.
                </p>
              </div>
            </div>

            {/* Quick hours card */}
            <div className="bg-primary p-6 rounded-sm">
              <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-gold-light mb-3">Dining Hours</p>
              <div className="space-y-2">
                {[
                  ['Breakfast', '6:30 AM – 10:00 AM'],
                  ['Lunch',     '12:00 PM – 3:00 PM'],
                  ['Dinner',    '6:00 PM – 10:00 PM'],
                ].map(([meal, time]) => (
                  <div key={meal} className="flex justify-between items-center">
                    <span className="font-sans text-xs text-white/70">{meal}</span>
                    <span className="font-sans text-xs text-gold-light font-medium">{time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="font-sans text-[10px] text-white/50">Room service available on request</p>
              </div>
            </div>
          </div>

        </div>

        {/* Highlights row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((h) => (
            <div key={h.label} className="bg-white border border-stone/60 p-6 rounded-sm hover:border-gold/40 transition-colors duration-200">
              <p className="text-2xl mb-3">{h.icon}</p>
              <p className="font-serif text-lg text-ink mb-2">{h.label}</p>
              <p className="font-sans text-xs text-ink/55 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Live Menu — only renders once menu items exist in Sanity ── */}
        {menuItems?.length > 0 && (
          <div className="mt-16 pt-16 border-t border-stone/40">

            {/* Menu header */}
            <div className="text-center mb-10">
              <p className="section-label mb-3">Culinary Offerings</p>
              <div className="gold-divider mx-auto mb-5" />
              <h3 className="font-serif text-3xl lg:text-4xl text-ink">
                Our <em>Menu</em>
              </h3>
            </div>

            {/* Category tabs */}
            {menuCategories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {menuCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveMenuCat(cat)}
                    className={`
                      font-sans text-[10px] uppercase tracking-[0.25em] px-5 py-2.5
                      border transition-all duration-200
                      ${resolvedCat === cat
                        ? 'bg-primary border-primary text-white'
                        : 'border-stone text-ink/50 hover:border-primary hover:text-primary bg-white'
                      }
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Menu item grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border border-stone/50 rounded-sm overflow-hidden hover:border-gold/40 hover:shadow-md transition-all duration-200 group"
                >
                  {item.image && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={imgUrl(item.image, 500, 281)}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg text-ink leading-snug">{item.name}</p>
                        {item.description && (
                          <p className="font-sans text-xs text-ink/55 leading-relaxed mt-1.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <p className="font-sans text-sm font-semibold text-primary flex-shrink-0 mt-0.5 whitespace-nowrap">
                        KES {item.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footnote */}
            <p className="text-center font-sans text-xs text-ink/35 mt-8 tracking-wide">
              Prices inclusive of taxes · Menu subject to seasonal availability
            </p>
          </div>
        )}

      </div>
    </section>
  )
}
