import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';

// --- Helper: get time‑based greeting ---
const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// --- Enhanced FAQ with keyword scoring ---
const faq = [
  {
    keywords: ['check in', 'check-in', 'arrival', 'when can i arrive', 'early check in'],
    answer: 'Check‑in is from 2:00 PM. Early arrivals are welcome to relax in our lobby until your room is ready. Late check‑out is available upon request.',
  },
  {
    keywords: ['check out', 'check-out', 'departure', 'leave', 'late check out'],
    answer: 'Check‑out is at 11:00 AM. Late check‑out is available upon request, subject to availability.',
  },
  {
    keywords: ['room', 'suite', 'accommodation', 'stay', 'rooms', 'bed', 'twin', 'king'],
    answer: 'We offer 60 well-appointed rooms with single, twin, or king‑size beds. Each room has an en‑suite bathroom, work desk, TV, and high‑speed Wi‑Fi.',
  },
  {
    keywords: ['price', 'prices', 'cost', 'rate', 'how much', 'booking', 'book', 'reserve', 'availability'],
    answer: 'For room rates, availability, or to make a booking, please visit our booking page or call reception at +254 714 302 777. We’d be happy to offer you the best available rate.',
  },
  {
    keywords: ['conference', 'meeting', 'event', 'hall', 'delegate', 'conference room'],
    answer: 'Our spacious conference room accommodates up to 250 delegates and is equipped with high‑speed Wi‑Fi, state‑of‑the‑art AV, and catering. We also offer event planning services and modern tent rentals.',
  },
  {
    keywords: ['wedding', 'weddings', 'ceremony', 'reception', 'event planning'],
    answer: 'We offer full event planning for weddings and celebrations. Our versatile venue can be tailored to your needs – contact our events team for a personalised quote.',
  },
  {
    keywords: ['restaurant', 'dining', 'food', 'breakfast', 'lunch', 'dinner', 'eat', 'menu'],
    answer: 'Our on‑site restaurant serves local and international dishes. Complimentary breakfast is served daily from 6:30 AM to 10:00 AM.',
  },
  {
    keywords: ['bar', 'drink', 'cocktail', 'lounge'],
    answer: 'We have a bar on site where you can enjoy refreshing drinks and light snacks.',
  },
  {
    keywords: ['parking', 'car', 'vehicle', 'park', 'free parking'],
    answer: 'Yes, we offer free on‑site parking for all guests. It’s secure and well‑lit.',
  },
  {
    keywords: ['wifi', 'internet', 'connection', 'wireless', 'password'],
    answer: 'Complimentary high‑speed Wi‑Fi is available throughout the hotel. The password is displayed at reception and in each room.',
  },
  {
    keywords: ['gym', 'fitness', 'workout', 'exercise'],
    answer: 'We have a fitness centre with modern equipment, available for all guests.',
  },

  {
    keywords: ['spa', 'massage', 'wellness'],
    answer: 'Our spa offers a range of treatments and massages. Please enquire at reception for availability and pricing.',
  },
  {
    keywords: ['contact', 'phone', 'email', 'number', 'reach'],
    answer: 'You can reach us at +254 700 123456 or email info@hotelitoya.co.ke. Our reception is open 24/7.',
  },
  {
    keywords: ['location', 'address', 'where', 'directions', 'map'],
    answer: 'We are located on B1 Kisumu – Busia Road, in the heart of Busia Town, right on the Kenya‑Uganda border.',
  },
  {
    keywords: ['airport', 'shuttle', 'transfer', 'taxi'],
    answer: 'We can arrange airport shuttle services upon request for an additional fee. Please notify us in advance.',
  },
  {
    keywords: ['pets', 'dog', 'animal', 'pet friendly'],
    answer: 'Unfortunately, we do not allow pets on the premises.',
  },
  {
    keywords: ['breakfast hours', 'breakfast time', 'when is breakfast'],
    answer: 'Breakfast is served from 6:30 AM to 10:00 AM daily in the restaurant.',
  },
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `${getTimeGreeting()}, welcome to Hotel Itoya! How may I assist you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Smarter answer finder: scoring based on keyword matches ---
  const findAnswer = (question) => {
    const lower = question.toLowerCase().trim();
    if (!lower) return "Please ask a question, and I'll do my best to help.";

    let bestEntry = null;
    let bestScore = 0;

    for (const entry of faq) {
      let score = 0;
      for (const kw of entry.keywords) {
        // Count how many keywords appear (exact substring match)
        if (lower.includes(kw.toLowerCase())) {
          score += 1;
        }
      }
      // Prefer longer keyword matches (e.g., "check in" over "in")
      // Also prefer entries with more total keywords matched.
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (bestEntry && bestScore > 0) {
      return bestEntry.answer;
    }

    // Fallback with suggestions
    const topics = ['rooms', 'conference', 'dining', 'parking', 'wedding', 'contact', 'location'];
    const suggestion = topics.map(t => `"${t}"`).join(', ');
    return `I’m not quite sure about that. Could you try asking about ${suggestion}, or call reception at +254 700 123456 and we’ll assist you personally.`;
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const reply = findAnswer(input);
      setMessages((prev) => [...prev, { role: 'bot', content: reply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-xl shadow-gold/30 transition-all hover:scale-105 hover:shadow-2xl"
        >
          <FaComments size={22} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/10 border border-stone/100">
          {/* Header */}
          <div className="flex items-center justify-between bg-ink px-6 py-4">
            <div>
              <h3 className="font-serif text-lg text-white">Itoya Help BOT</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Online</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <FaTimes size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gold text-white'
                      : 'bg-stone/50 text-ink/80 border border-stone/100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-stone/50 px-4 py-3 text-sm text-ink/60">
                  <span className="animate-pulse">Itoya is thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-stone/100 px-4 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
              disabled={loading}
            />
            <button
              type="submit"
              className="rounded-full bg-gold p-2 text-white transition hover:bg-gold-dark disabled:opacity-50"
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