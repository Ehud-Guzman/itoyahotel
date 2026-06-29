import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaWhatsapp } from 'react-icons/fa';

const PHONE_1 = '+254 714 302 777';
const PHONE_2 = '+254 714 666 222';
const EMAIL = 'info@hotelitoya.co.ke';
const WA_URL = 'https://wa.me/254714302777';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const FAQ = [
  {
    keywords: ['check in', 'check-in', 'checkin', 'arrival', 'when can i arrive', 'early check in', 'early arrival'],
    answer: 'Check-in is from 2:00 PM. Early arrivals are welcome to relax in our lobby. Late check-out is available upon request, subject to availability.',
  },
  {
    keywords: ['check out', 'check-out', 'checkout', 'departure', 'late check out', 'when do i leave'],
    answer: 'Check-out is at 11:00 AM. Late check-out can be arranged upon request — please inform reception the evening before.',
  },
  {
    keywords: ['room types', 'types of rooms', 'what rooms', 'room categories', 'accommodation options', 'room options'],
    answer: `We offer four room categories:\n\n• **Standard** — comfortable essentials\n• **Deluxe** — upgraded space and furnishings\n• **Super Deluxe** — premium comfort\n• **Executive** — our finest rooms\n\nAll include en-suite bathroom, flat-screen TV, work desk, and free Wi-Fi.`,
  },
  {
    keywords: ['standard room', 'standard'],
    answer: 'Our Standard Rooms offer a comfortable bed (single, twin, or king), en-suite bathroom, flat-screen TV, work desk, and complimentary Wi-Fi — everything you need for a great stay.',
  },
  {
    keywords: ['deluxe room', 'deluxe'],
    answer: 'Deluxe Rooms offer upgraded furnishings and more space — a step up in comfort and style from the Standard category.',
  },
  {
    keywords: ['super deluxe', 'super-deluxe', 'superdeluxe'],
    answer: 'Super Deluxe Rooms combine premium décor with generous space and top-tier in-room facilities — ideal for longer stays or special occasions.',
  },
  {
    keywords: ['executive room', 'executive suite', 'executive'],
    answer: 'Our Executive Rooms are the finest at Hotel Itoya — premium finishes, superior space, and exclusive amenities. Perfect for business executives and discerning guests.',
  },
  {
    keywords: ['room', 'rooms', 'suite', 'suites', 'accommodation', 'stay', 'bed', 'twin', 'king'],
    answer: 'We offer 60+ well-appointed rooms across four categories: Standard, Deluxe, Super Deluxe, and Executive. All rooms include en-suite bathrooms, TV, work desk, and free Wi-Fi.',
  },
  {
    keywords: ['price', 'prices', 'cost', 'rate', 'how much', 'rates', 'tariff', 'fees'],
    answer: `Room rates vary by category and season. For current pricing, call us at ${PHONE_1} or send a WhatsApp message — we'll find you the best available rate.`,
  },
  {
    keywords: ['book', 'booking', 'reserve', 'reservation', 'availability', 'available rooms'],
    answer: `To book or check availability, use the **Enquiry form** on this page or contact us directly:\n\n📞 ${PHONE_1}\n✉️ ${EMAIL}\n\nOur team will get back to you promptly.`,
  },
  {
    keywords: ['restaurant', 'dining', 'food', 'eat', 'menu', 'cuisine', 'dining hours'],
    answer: `Our restaurant serves local and international cuisine daily:\n\n• 🌅 Breakfast: 6:30 – 10:00 AM\n• ☀️ Lunch: 12:00 – 3:00 PM\n• 🌙 Dinner: 6:00 – 10:00 PM\n\nRoom service is also available during these hours.`,
  },
  {
    keywords: ['breakfast', 'morning meal', 'when is breakfast', 'breakfast time', 'breakfast hours'],
    answer: 'Breakfast is served daily from 6:30 AM to 10:00 AM. We offer a hearty mix of continental and local dishes.',
  },
  {
    keywords: ['lunch', 'afternoon meal', 'lunch hours', 'lunch time'],
    answer: 'Lunch is served from 12:00 PM to 3:00 PM daily. Our kitchen offers a varied menu of local and international options.',
  },
  {
    keywords: ['dinner', 'supper', 'evening meal', 'dinner hours', 'dinner time'],
    answer: 'Dinner is served from 6:00 PM to 10:00 PM. Join us for a relaxed evening meal with our full restaurant menu.',
  },
  {
    keywords: ['room service', 'in-room dining', 'deliver food', 'food to room', 'order food'],
    answer: 'Room service is available during restaurant hours (6:30 AM – 10:00 PM). Call reception and we will deliver your order to your room.',
  },
  {
    keywords: ['bar', 'drinks', 'cocktail', 'lounge', 'alcohol', 'beer', 'wine'],
    answer: 'Our bar and lounge is the perfect place to unwind — enjoy cocktails, cold drinks, wines, or light snacks in a relaxed atmosphere.',
  },
  {
    keywords: ['conference', 'meeting room', 'conference room', 'seminar', 'workshop', 'training', 'delegate', 'av equipment', 'projector'],
    answer: `Our conference hall accommodates up to **250 delegates** and features:\n\n• AV equipment & projector\n• High-speed Wi-Fi\n• Flexible seating configurations\n• Full catering service\n\nContact us for a customised conference package.`,
  },
  {
    keywords: ['wedding', 'bride', 'groom', 'ceremony', 'bridal', 'wedding venue', 'wedding reception'],
    answer: 'We offer complete wedding coordination — venue, catering, décor, and more. Contact our events team for a personalised quote.',
  },
  {
    keywords: ['outside catering', 'outdoor catering', 'catering service', 'mobile kitchen', 'off-site catering'],
    answer: 'We offer outside catering and mobile kitchen services — we bring Hotel Itoya cuisine to your venue. Contact our events team for pricing and availability.',
  },
  {
    keywords: ['events', 'event', 'corporate event', 'gala', 'party', 'function', 'celebration', 'launch'],
    answer: 'We host a wide range of events — corporate galas, cultural celebrations, product launches, and more. Our events team handles every detail from planning to execution.',
  },
  {
    keywords: ['homeland itoya', 'homeland', 'outdoor venue', 'outdoor event space'],
    answer: 'Homeland Itoya is our outdoor sister venue — spacious and perfect for large-scale events, garden parties, and cultural celebrations. Ask our events team for details.',
  },
  {
    keywords: ['parking', 'car park', 'vehicle', 'park', 'free parking', 'secure parking', 'where to park'],
    answer: 'Free, secure, and well-lit on-site parking is available for all guests. No need to worry about your vehicle.',
  },
  {
    keywords: ['wifi', 'wi-fi', 'internet', 'wireless', 'broadband', 'connection', 'password', 'network'],
    answer: 'Complimentary high-speed Wi-Fi is available throughout the hotel — rooms, restaurant, bar, and conference hall. The password is at reception and in your room.',
  },
  {
    keywords: ['gym', 'fitness', 'fitness centre', 'workout', 'exercise', 'weights'],
    answer: 'Our fitness centre with modern equipment is available to all guests. Ask at reception for access and opening times.',
  },
  {
    keywords: ['spa', 'massage', 'wellness', 'treatment', 'relax', 'pamper'],
    answer: 'Our spa offers a range of relaxing treatments and massages. Ask at reception for the treatment menu, availability, and pricing.',
  },
  {
    keywords: ['pets', 'dog', 'cat', 'animal', 'pet friendly', 'bring my pet'],
    answer: 'We are unable to accommodate pets on the premises. If you travel with a service animal, please contact us in advance and we will do our best to assist.',
  },
  {
    keywords: ['contact', 'phone', 'call', 'email', 'reach', 'telephone', 'number', 'reception'],
    answer: `Our reception is open **24/7**:\n\n📞 ${PHONE_1}\n📞 ${PHONE_2}\n✉️ ${EMAIL}\n\nOr send us a WhatsApp message for a quick response.`,
  },
  {
    keywords: ['whatsapp', 'whats app', 'wa', 'message us', 'text us'],
    answer: `WhatsApp us at **${PHONE_1}** — we typically respond within minutes during business hours.`,
  },
  {
    keywords: ['location', 'address', 'where are you', 'how to get', 'directions', 'map', 'find you', 'busia'],
    answer: `We are on **B1 Kisumu–Busia Road, Busia, Kenya** — right on the Kenya-Uganda border.\n\n• From Nairobi: ~7 hrs via A104\n• From Kisumu: ~1.5 hrs via A1\n• From Kampala: ~2 hrs via A109`,
  },
  {
    keywords: ['airport', 'shuttle', 'transfer', 'taxi', 'pickup', 'pick up', 'transport'],
    answer: 'We can arrange airport transfers and shuttle services upon request. Please contact us in advance so we can make the necessary arrangements.',
  },
  {
    keywords: ['ayoti', 'ayoti group', 'who owns', 'management', 'parent company'],
    answer: 'Hotel Itoya is proudly part of the Ayoti Group — a trusted hospitality and business group operating across East Africa.',
  },
  {
    keywords: ['about', 'tell me about', 'who are you', 'what is hotel itoya', 'hotel itoya'],
    answer: 'Hotel Itoya is a premier business hotel in Busia, Kenya — on the Kenya-Uganda border. We offer 60+ rooms, a full-service restaurant, conference facilities, event services, and more, all under the Ayoti Group.',
  },
];

// Weighted scoring: longer keyword phrases are more specific and score higher
const findAnswer = (question) => {
  const lower = question.toLowerCase().trim();
  if (!lower) return null;
  let best = null;
  let bestScore = 0;
  for (const entry of FAQ) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        score += kw.split(/\s+/).length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best.answer : null;
};

const QUICK_CHIPS = [
  { label: 'Room types',   query: 'what room types do you have' },
  { label: 'Dining hours', query: 'what are the dining hours' },
  { label: 'Conference',   query: 'conference facilities' },
  { label: 'Location',     query: 'where are you located' },
  { label: 'Parking',      query: 'do you have parking' },
  { label: 'Contact',      query: 'how do I contact you' },
];

// Renders **bold** and \n line breaks
const MsgText = ({ text }) => (
  <span>
    {text.split('\n').map((line, i, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i} className={i < arr.length - 1 ? 'block' : ''}>
          {parts.map((p, j) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={j}>{p.slice(2, -2)}</strong>
              : p
          )}
        </span>
      );
    })}
  </span>
);

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'bot',
    content: `${getGreeting()}, welcome to Hotel Itoya!\n\nHow can I assist you today? Ask me about rooms, dining, conference facilities, or anything else.`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setAtTop(window.scrollY <= 180);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const send = (text) => {
    if (!text.trim() || loading) return;
    setShowChips(false);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const answer = findAnswer(text);
      setMessages(prev => [...prev, { role: 'bot', content: answer, isFallback: !answer }]);
      setLoading(false);
    }, 700);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${atTop ? 'bottom-12' : 'bottom-4'} right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-xl shadow-gold/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl`}
          aria-label="Open chat"
        >
          <FaComments size={22} />
        </button>
      )}

      {isOpen && (
        <div className={`fixed ${atTop ? 'bottom-12' : 'bottom-4'} right-3 sm:right-6 z-50 flex h-[520px] w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/10 border border-stone/20 transition-all duration-500`}>
          {/* Header */}
          <div className="flex items-center justify-between bg-ink px-5 py-4">
            <div>
              <h3 className="font-serif text-base text-white">Hotel Itoya Concierge</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Online · Replies instantly</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors"
                title="Chat on WhatsApp"
              >
                <FaWhatsapp size={20} />
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gold text-white rounded-br-sm'
                    : 'bg-stone/30 text-ink/80 border border-stone/20 rounded-bl-sm'
                }`}>
                  {msg.isFallback ? (
                    <span>
                      <span className="block">
                        I'm not sure about that one. Try asking about rooms, dining, conference, parking, or location — or reach us directly:
                      </span>
                      <a
                        href={WA_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-white text-xs font-medium hover:bg-green-600 transition-colors"
                      >
                        <FaWhatsapp size={13} /> Chat on WhatsApp
                      </a>
                    </span>
                  ) : (
                    <MsgText text={msg.content} />
                  )}
                </div>
              </div>
            ))}

            {/* Quick reply chips — visible until first user message */}
            {showChips && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_CHIPS.map(({ label, query }) => (
                  <button
                    key={label}
                    onClick={() => send(query)}
                    className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-xs text-gold hover:bg-gold hover:text-white transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-stone/30 border border-stone/20 px-4 py-3">
                  <span className="flex gap-1 items-center">
                    {[0, 150, 300].map(delay => (
                      <span
                        key={delay}
                        className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-stone/20 px-4 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
              disabled={loading}
            />
            <button
              type="submit"
              className="rounded-full bg-gold p-2 text-white transition hover:bg-gold-dark disabled:opacity-40"
              disabled={loading || !input.trim()}
            >
              <FaPaperPlane size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
