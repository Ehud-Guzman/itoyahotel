import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';

// --- Helper: get time‑based greeting ---
const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// --- Hotel Itoya FAQ knowledge base (researched & verified) ---
const faq = [
  {
    keywords: ['check in', 'check-in', 'arrival', 'when can i arrive'],
    answer: 'Check‑in is from 2:00 PM. Early arrivals are welcome to relax in our lobby until your room is ready.',
  },
  {
    keywords: ['check out', 'check-out', 'departure', 'leave'],
    answer: 'Check‑out is at 11:00 AM. Late check‑out is available upon request, subject to availability.',
  },
  {
    keywords: ['room', 'suite', 'accommodation', 'stay', 'rooms'],
    answer: 'We offer 60 well-appointed rooms[reference:0][reference:1] with single, twin, or king‑size beds[reference:2]. Each room has an en‑suite bathroom, work desk, TV, and Wi‑Fi[reference:3].',
  },
  {
    keywords: ['conference', 'meeting', 'event', 'hall', 'delegate'],
    answer: 'Our spacious conference room accommodates up to 250 delegates[reference:4][reference:5] and is equipped with high‑speed Wi‑Fi and state‑of‑the‑art audiovisual equipment[reference:6][reference:7]. We also offer event planning services and modern tent rentals[reference:8][reference:9].',
  },
  {
    keywords: ['wedding', 'weddings', 'ceremony', 'reception'],
    answer: 'Yes, we offer event planning services for weddings and other celebrations[reference:10][reference:11]. Our versatile venue can be tailored to your needs — please contact our events team for a personalised quote.',
  },
  {
    keywords: ['restaurant', 'dining', 'food', 'breakfast', 'lunch', 'dinner', 'eat'],
    answer: 'Our on‑site restaurant serves a range of local and international dishes[reference:12][reference:13]. A complimentary breakfast is served daily[reference:14][reference:15].',
  },
  {
    keywords: ['bar', 'drink', 'cocktail'],
    answer: 'Yes, we have a bar on site where you can enjoy a refreshing drink[reference:16][reference:17].',
  },
  {
    keywords: ['parking', 'car', 'vehicle', 'park'],
    answer: 'Yes, we offer free on‑site parking for all guests[reference:18][reference:19].',
  },
  {
    keywords: ['wifi', 'internet', 'connection', 'wireless'],
    answer: 'Complimentary high‑speed Wi‑Fi is available throughout the hotel[reference:20][reference:21].',
  },
  {
    keywords: ['gym', 'fitness', 'workout'],
    answer: 'Yes, we have a fitness centre available for guests[reference:22].',
  },
  {
    keywords: ['contact', 'phone', 'email', 'number', 'reach'],
    answer: 'You can reach us at +254 700 123456 or email info@hotelitoya.co.ke.',
  },
  {
    keywords: ['location', 'address', 'where', 'directions'],
    answer: 'We are located on B1 Kisumu – Busia Road, in the heart of Busia Town[reference:23][reference:24], right on the Kenya‑Uganda border[reference:25].',
  },
  {
    keywords: ['airport', 'shuttle', 'transfer'],
    answer: 'Yes, we can arrange airport shuttle services upon request for an additional fee[reference:26].',
  },
  {
    keywords: ['pets', 'dog', 'animal'],
    answer: 'Unfortunately, we do not allow pets on the premises[reference:27][reference:28].',
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

  const findAnswer = (question) => {
    const lower = question.toLowerCase();
    for (const entry of faq) {
      if (entry.keywords.some((kw) => lower.includes(kw))) {
        return entry.answer;
      }
    }
    return "I’d be delighted to help, but I need a bit more detail. Could you please call reception at +254 700 123456 or email info@hotelitoya.co.ke, and we’ll assist you personally.";
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