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

// ── Social word lists (exact-match checked before FAQ scoring) ──────────────
const GREETINGS   = ['hi','hello','hey','hiya','howdy','sup','good morning','good afternoon','good evening','good night','greetings','salut','habari','mambo','niaje','sasa','karibu'];
const FAREWELLS   = ['bye','goodbye','good bye','see you','cya','take care','farewell','later','talk later','see ya','ttyl','kwaheri'];
const THANKS      = ['thank you','thanks','thank u','thankyou','thx','cheers','appreciated','asante','thank you so much','thanks a lot','thanks so much','many thanks'];
const AFFIRMATIONS= ['ok','okay','alright','got it','understood','noted','sure','great','perfect','nice','cool','awesome','wonderful','ok thanks','okay thanks','sounds good','makes sense','that helps'];
const NEGATIONS   = ['no','nope','nah','not really','nothing else',"that's all",'all good','im good',"i'm good",'no thanks','no thank you','nothing','never mind','nevermind'];

const FAQ = [
  // ── Check-in / Check-out ────────────────────────────────────────────────
  {
    keywords: ['check in','check-in','checkin','arrival','when can i arrive','early check in','early arrival'],
    answer: 'Check-in is from **2:00 PM**. Early arrivals are welcome to relax in our lobby while your room is prepared. Early check-in can sometimes be arranged subject to availability — contact us in advance.',
  },
  {
    keywords: ['check out','check-out','checkout','departure','late check out','when do i leave','checkout time','check out time'],
    answer: 'Check-out is at **11:00 AM**. Late check-out can be arranged upon request — please let reception know the evening before. A small fee may apply depending on how late.',
  },

  // ── Rooms ───────────────────────────────────────────────────────────────
  {
    keywords: ['room types','types of rooms','what rooms','room categories','accommodation options','room options','kinds of rooms'],
    answer: `We offer four room categories:\n\n• **Standard** — comfortable essentials\n• **Deluxe** — upgraded space & furnishings\n• **Super Deluxe** — premium comfort\n• **Executive** — our finest rooms\n\nAll include en-suite bathroom, flat-screen TV, work desk, and free Wi-Fi.`,
  },
  {
    keywords: ['standard room','standard'],
    answer: 'Our **Standard Rooms** offer a comfortable bed (single, twin, or king), en-suite bathroom, flat-screen TV, work desk, and complimentary Wi-Fi — everything you need for a great stay.',
  },
  {
    keywords: ['deluxe room','deluxe'],
    answer: '**Deluxe Rooms** offer upgraded furnishings and more space — a step up in comfort and style from the Standard category.',
  },
  {
    keywords: ['super deluxe','super-deluxe','superdeluxe'],
    answer: '**Super Deluxe Rooms** combine premium décor with generous space and top-tier in-room facilities — ideal for longer stays or special occasions.',
  },
  {
    keywords: ['executive room','executive suite','executive'],
    answer: 'Our **Executive Rooms** are the finest at Hotel Itoya — premium finishes, superior space, and exclusive amenities. Perfect for business executives and discerning guests.',
  },
  {
    keywords: ['single room','single bed'],
    answer: 'We have single-bed room options available in our Standard category. Contact us and we\'ll confirm availability for your travel dates.',
  },
  {
    keywords: ['double room','double bed'],
    answer: 'Double-bed rooms are available across multiple categories. Let us know your preference when booking and we\'ll match you with the best option.',
  },
  {
    keywords: ['twin room','twin beds','two beds'],
    answer: 'Twin-bed rooms (two separate beds) are available. Please mention your preference when booking so we can arrange accordingly.',
  },
  {
    keywords: ['room','rooms','suite','suites','accommodation','stay','bed','king'],
    answer: 'We offer **60+ well-appointed rooms** across four categories: Standard, Deluxe, Super Deluxe, and Executive. All include en-suite bathrooms, TV, work desk, and free Wi-Fi.',
  },

  // ── Pricing & Booking ───────────────────────────────────────────────────
  {
    keywords: ['price','prices','cost','rate','how much','rates','tariff','fees','charges'],
    answer: `Room rates vary by category and season. For current pricing and the best available rate, reach us on:\n\n📞 ${PHONE_1}\n💬 WhatsApp us for a quick quote`,
  },
  {
    keywords: ['book','booking','reserve','reservation','availability','available rooms','make a booking','book a room'],
    answer: `To book or check availability, use the **Enquiry form** on this page, or contact us directly:\n\n📞 ${PHONE_1}\n✉️ ${EMAIL}\n\nOur team responds promptly.`,
  },
  {
    keywords: ['deposit','advance payment','prepayment','pre-payment','booking deposit'],
    answer: 'Some bookings may require a deposit to secure your reservation. Our reservations team will confirm the amount and payment instructions when you book.',
  },
  {
    keywords: ['cancellation','cancel booking','cancel reservation','cancel my booking','cancellation policy'],
    answer: 'Cancellation terms vary by booking type and season. Please contact our reservations team directly for specific cancellation and refund information.',
  },
  {
    keywords: ['refund','money back','get my money back'],
    answer: 'Refund eligibility depends on the cancellation policy applied to your booking. Contact us directly and our team will advise you on the next steps.',
  },
  {
    keywords: ['discount','offer','deal','promotion','special offer','package','corporate rate','group rate'],
    answer: `We offer corporate rates, group discounts, and seasonal packages. Contact our reservations team for the best available deal:\n\n📞 ${PHONE_1}\n✉️ ${EMAIL}`,
  },

  // ── Payment ─────────────────────────────────────────────────────────────
  {
    keywords: ['payment','pay','how to pay','payment method','payment options','accepted payments','how can i pay'],
    answer: 'We accept the following payment methods:\n\n• 💵 Cash (KES & USD)\n• 📱 M-Pesa\n• 💳 Visa & Mastercard\n\nFor corporate accounts, bank transfers are also available. Ask reception for details.',
  },
  {
    keywords: ['mpesa','m-pesa','mobile money','mobile payment','lipa na mpesa'],
    answer: 'Yes, we accept **M-Pesa** payments. Our paybill/till details will be provided at check-in or when you contact us to confirm your booking.',
  },
  {
    keywords: ['cash','dollars','usd','kenya shillings','kes','currency','foreign currency'],
    answer: 'We accept both **Kenyan Shillings (KES)** and **US Dollars (USD)**. Our front desk can also advise on nearby currency exchange services.',
  },
  {
    keywords: ['card','credit card','debit card','visa','mastercard'],
    answer: 'We accept **Visa and Mastercard** debit/credit cards. Please inform us in advance for large transactions so we can prepare accordingly.',
  },

  // ── Dining ──────────────────────────────────────────────────────────────
  {
    keywords: ['restaurant','dining','food','eat','menu','cuisine','dining hours','open for food'],
    answer: `Our restaurant serves local and international cuisine daily:\n\n• 🌅 Breakfast: 6:30 – 10:00 AM\n• ☀️ Lunch: 12:00 – 3:00 PM\n• 🌙 Dinner: 6:00 – 10:00 PM\n\nRoom service is available during all restaurant hours.`,
  },
  {
    keywords: ['breakfast','morning meal','when is breakfast','breakfast time','breakfast hours'],
    answer: 'Breakfast is served daily from **6:30 AM to 10:00 AM** — a hearty mix of continental and local dishes to start your day right.',
  },
  {
    keywords: ['lunch','afternoon meal','lunch hours','lunch time'],
    answer: 'Lunch is served from **12:00 PM to 3:00 PM** daily — a varied menu of local and international options.',
  },
  {
    keywords: ['dinner','supper','evening meal','dinner hours','dinner time'],
    answer: 'Dinner is served from **6:00 PM to 10:00 PM**. Join us for a relaxed evening meal with our full restaurant menu.',
  },
  {
    keywords: ['room service','in-room dining','deliver food','food to room','order food'],
    answer: 'Room service is available during restaurant hours (**6:30 AM – 10:00 PM**). Call reception and we will deliver your order to your room.',
  },
  {
    keywords: ['bar','drinks','cocktail','lounge','alcohol','beer','wine','spirits','juice'],
    answer: 'Our bar and lounge is the perfect place to unwind — enjoy cocktails, cold drinks, wines, spirits, or light snacks in a relaxed atmosphere.',
  },
  {
    keywords: ['vegetarian','vegan','halal','dietary','allergen','gluten','special diet','food allergy'],
    answer: 'Our kitchen can accommodate various dietary requirements including vegetarian, vegan, and halal options. Please inform us of any food allergies or special dietary needs when ordering.',
  },
  {
    keywords: ['takeaway','takeout','take away','pack food','carry out'],
    answer: 'Yes, takeaway orders from our restaurant are available. Simply call reception or visit our restaurant to place your order.',
  },
  {
    keywords: ['coffee','tea','hot drink','cappuccino','espresso','chai'],
    answer: 'Our restaurant and bar serve a full selection of hot and cold beverages — coffee, tea, chai, and more — available during restaurant hours.',
  },

  // ── Conference & Events ─────────────────────────────────────────────────
  {
    keywords: ['conference','meeting room','conference room','seminar','workshop','training','delegate','av equipment','projector','conference hall'],
    answer: `Our conference hall accommodates up to **250 delegates** and features:\n\n• AV equipment & projector\n• High-speed Wi-Fi\n• Flexible seating configurations\n• Full catering service\n\nContact us for a customised conference package.`,
  },
  {
    keywords: ['team building','corporate retreat','offsite','company event','staff training','hr event','corporate team'],
    answer: 'We offer excellent facilities for corporate team building and retreats — conference hall, catering, and accommodation packages all in one place. Contact our events team for a custom proposal.',
  },
  {
    keywords: ['wedding','bride','groom','ceremony','bridal','wedding venue','wedding reception','wedding package'],
    answer: 'We offer complete wedding coordination — venue, catering, décor, and more. Our events team will work with you to create the perfect day. Contact us for a personalised quote.',
  },
  {
    keywords: ['birthday','birthday party','celebrate birthday','birthday surprise','birthday celebration'],
    answer: 'We\'d love to help make your birthday special! Contact us in advance and we can arrange a cake, decorations, and a birthday setup — in your room or at our restaurant.',
  },
  {
    keywords: ['anniversary','honeymoon','newlywed','romantic','couples getaway','special occasion'],
    answer: 'Congratulations on your special occasion! Contact our team in advance and we\'ll arrange a romantic setup — flowers, special décor, and more — to make your stay truly unforgettable.',
  },
  {
    keywords: ['proposal','engage','engagement','surprise proposal'],
    answer: 'How exciting! Our team can help set up a memorable proposal or surprise. Contact us directly and we\'ll make it a moment to cherish forever.',
  },
  {
    keywords: ['outside catering','outdoor catering','catering service','mobile kitchen','off-site catering'],
    answer: 'We offer outside catering and mobile kitchen services — bringing Hotel Itoya cuisine directly to your venue. Contact our events team for pricing and availability.',
  },
  {
    keywords: ['events','event','corporate event','gala','party','function','celebration','launch','product launch'],
    answer: 'We host a wide range of events — corporate galas, cultural celebrations, product launches, graduation parties, and more. Our events team handles every detail from planning to execution.',
  },
  {
    keywords: ['homeland itoya','homeland','outdoor venue','outdoor event space','homeland events'],
    answer: '**Homeland Itoya** is our outdoor sister venue — spacious and perfect for large-scale events, garden parties, and cultural celebrations. Ask our events team for details and availability.',
  },
  {
    keywords: ['capacity','how many people','how many guests','maximum guests','event capacity'],
    answer: 'Our conference hall holds up to **250 delegates**. For outdoor events at Homeland Itoya, capacity is much larger. Contact our events team for exact figures based on your event type.',
  },

  // ── Facilities & Amenities ──────────────────────────────────────────────
  {
    keywords: ['parking','car park','vehicle','free parking','secure parking','where to park','car security'],
    answer: '**Free, secure, and well-lit** on-site parking is available for all guests. Your vehicle is safe with us.',
  },
  {
    keywords: ['wifi','wi-fi','internet','wireless','broadband','connection','password','network','internet access'],
    answer: 'Complimentary **high-speed Wi-Fi** is available throughout the hotel — in rooms, the restaurant, bar, and conference hall. The password is provided at reception and in your room.',
  },
  {
    keywords: ['gym','fitness','fitness centre','workout','exercise','weights','treadmill'],
    answer: 'Our **fitness centre** with modern equipment is available to all guests. Ask at reception for access hours.',
  },
  {
    keywords: ['spa','massage','wellness','treatment','pamper','body treatment','facial'],
    answer: 'Our **spa** offers a range of relaxing treatments and massages. Ask at reception for the treatment menu, availability, and pricing.',
  },
  {
    keywords: ['air conditioning','ac','air con','aircon','fan','temperature','heating','cool'],
    answer: 'All our rooms are equipped with **air conditioning** to ensure your comfort regardless of the weather.',
  },
  {
    keywords: ['hot water','shower','bath','bathroom','en suite'],
    answer: 'All rooms feature private **en-suite bathrooms with hot water showers**. If you experience any issues, contact reception immediately.',
  },
  {
    keywords: ['tv','television','cable','dstv','channels','satellite','entertainment'],
    answer: 'All rooms include a **flat-screen TV** with cable/satellite channels for your entertainment.',
  },
  {
    keywords: ['minibar','fridge','refrigerator','kettle','tea','coffee in room','in-room drinks'],
    answer: 'In-room amenities vary by category. Please ask when booking and we\'ll confirm exactly what\'s included in your chosen room type.',
  },
  {
    keywords: ['safe deposit box','room safe','in-room safe','store valuables','valuables','locker'],
    answer: 'In-room safes and safety deposit facilities are available for securing your valuables. Ask reception for assistance.',
  },
  {
    keywords: ['luggage','baggage','store luggage','luggage storage','left luggage','bag storage','store bags'],
    answer: 'We offer **luggage storage** for guests — whether you arrive before check-in or need to leave bags after check-out. Just speak to reception.',
  },
  {
    keywords: ['laundry','dry cleaning','washing','iron','ironing','press clothes','wash clothes'],
    answer: 'Laundry and dry cleaning services are available for guests. Leave your items with reception or housekeeping and we\'ll take care of them promptly.',
  },
  {
    keywords: ['power','electricity','generator','power backup','power cut','load shedding','blackout'],
    answer: 'Hotel Itoya has **backup generator power** to ensure your stay is uninterrupted during any power outages.',
  },
  {
    keywords: ['plug','socket','adapter','power outlet','voltage','charger','plug type'],
    answer: 'Our rooms have standard **Kenyan power sockets (Type G, 240V)**. We recommend bringing a travel adapter if your devices use a different plug type.',
  },
  {
    keywords: ['print','printing','photocopy','scan','business center','business centre','secretarial','fax'],
    answer: 'Business services including **printing, photocopying, and scanning** are available. Ask at reception and we\'ll assist you.',
  },

  // ── Safety & Health ─────────────────────────────────────────────────────
  {
    keywords: ['safe','safety','security','cctv','secure','is it safe','24 hour security'],
    answer: 'Your safety is our priority. Hotel Itoya has **24-hour security**, CCTV surveillance, and in-room safes. Our premises are well-lit and monitored around the clock.',
  },
  {
    keywords: ['emergency','first aid','doctor','medical','hospital','ambulance','sick','ill','unwell'],
    answer: 'In a medical emergency, contact reception immediately — we have first aid on site and can arrange transport to the nearest hospital. **Reception is available 24/7.**',
  },
  {
    keywords: ['fire','fire safety','fire exit','evacuation','fire alarm'],
    answer: 'Hotel Itoya complies with all fire safety regulations. Fire exits are clearly marked throughout the property and our staff are trained in emergency procedures.',
  },
  {
    keywords: ['smoking','smoke','cigarette','non-smoking','smoking room','vape','shisha'],
    answer: 'Hotel Itoya is a **non-smoking property**. Designated smoking areas are available outside — ask reception for their location.',
  },

  // ── Families & Children ─────────────────────────────────────────────────
  {
    keywords: ['children','kids','child','family','baby','infant','toddler','family room','family friendly','bring kids'],
    answer: 'Hotel Itoya warmly welcomes families! We can arrange extra beds, baby cots, and family-friendly room setups. Please inform us of your family\'s needs when booking.',
  },
  {
    keywords: ['extra bed','additional bed','rollaway bed','cot','baby cot','crib','baby bed'],
    answer: 'Extra beds and baby cots are available on request, subject to room size and availability. Please mention this when booking so we can prepare in advance.',
  },
  {
    keywords: ['kids menu','children menu','food for kids','child food','children food'],
    answer: 'Our restaurant can prepare **child-friendly meals** on request. Please inform the kitchen of any dietary preferences or allergies for your little ones.',
  },

  // ── Local Area ──────────────────────────────────────────────────────────
  {
    keywords: ['nearby','near hotel','close by','what to do','activities','attractions','things to do','sightseeing','explore busia','busia town'],
    answer: 'Busia is a vibrant border town with plenty to explore:\n\n• Busia market & shopping\n• Kenya-Uganda border crossing\n• Local restaurants & cultural spots\n\nAsk our reception team for personalised recommendations!',
  },
  {
    keywords: ['atm','cash machine','bank','banking','withdraw money','where is atm'],
    answer: 'ATMs and banking services are available in **Busia town**, a short distance from the hotel. Our reception team can guide you to the nearest ones.',
  },
  {
    keywords: ['pharmacy','chemist','medicine','drug store','hospital nearby','clinic'],
    answer: 'Pharmacies, chemists, and medical facilities are available in Busia town within easy reach. Reception can point you to the nearest one.',
  },
  {
    keywords: ['supermarket','shopping','market','buy groceries','shop nearby','mall'],
    answer: 'Busia town has several supermarkets and a busy local market within easy reach of the hotel. Reception can advise on the closest options.',
  },
  {
    keywords: ['fuel','petrol','gas station','petrol station','diesel','fill up'],
    answer: 'Petrol stations are available in Busia town, close to the hotel. Ask reception for the nearest one.',
  },
  {
    keywords: ['border','busia border','kenya uganda border','crossing','immigration','customs','border crossing'],
    answer: 'Hotel Itoya is conveniently located right near the **Kenya-Uganda border** in Busia. Reception can advise on the crossing process and any current requirements.',
  },
  {
    keywords: ['quiet','noise','noisy','peaceful','silent','disturbance','loud'],
    answer: 'We strive to provide a peaceful environment for all guests. If you experience any noise disturbances during your stay, please contact reception immediately and we will address it.',
  },

  // ── Transport ───────────────────────────────────────────────────────────
  {
    keywords: ['airport','shuttle','transfer','taxi','pickup','pick up','transport','boda boda','matatu','uber','bolt'],
    answer: 'We can arrange **airport transfers and shuttle services** upon request. We can also advise on local taxis, boda bodas, and matatus. Contact us in advance to arrange.',
  },

  // ── Pets ────────────────────────────────────────────────────────────────
  {
    keywords: ['pets','dog','cat','animal','pet friendly','bring my pet'],
    answer: 'We are unable to accommodate pets on the premises. If you travel with a service animal, please contact us in advance and we will do our best to assist.',
  },

  // ── Accessibility ────────────────────────────────────────────────────────
  {
    keywords: ['wheelchair','disabled','accessible','disability','mobility','special needs','handicap'],
    answer: 'We are committed to making every guest comfortable. Please contact us in advance with your specific accessibility requirements so we can make the best arrangements for your stay.',
  },

  // ── Feedback & Complaints ───────────────────────────────────────────────
  {
    keywords: ['complaint','complain','unhappy','disappointed','problem','issue','speak to manager','manager','supervisor','not happy'],
    answer: `We're sorry to hear you've had a concern. Please contact our management team directly and we will resolve it as a priority:\n\n📞 ${PHONE_1}\n✉️ ${EMAIL}\n\nYour satisfaction is everything to us.`,
  },
  {
    keywords: ['review','tripadvisor','google review','rating','feedback','rate us','leave a review'],
    answer: 'We\'d love to hear about your experience! Leave us a review on **Google** or **TripAdvisor** — search for **Hotel Itoya Busia**. Your feedback helps us serve you better.',
  },
  {
    keywords: ['instagram','facebook','social media','follow us','tiktok','twitter'],
    answer: 'Find us on social media for the latest updates, offers, and highlights. Search **Hotel Itoya** or **Ayoti Group** on your preferred platform.',
  },

  // ── Bot identity & help ─────────────────────────────────────────────────
  {
    keywords: ['who are you','what are you','are you a bot','are you human','are you ai','are you real','robot','chatbot','virtual assistant'],
    answer: 'I\'m the **Hotel Itoya virtual concierge** — here to answer your questions instantly, any time of day. For anything I can\'t handle, our human team is just a call or WhatsApp away!',
  },
  {
    keywords: ['how are you','how are you doing','hows it going','how\'s it going'],
    answer: 'I\'m doing wonderfully, thank you for asking! Ready to help make your Hotel Itoya experience exceptional. What can I do for you?',
  },
  {
    keywords: ['help','what can you do','what do you know','how can you help','options','what can i ask'],
    answer: 'I can help you with:\n\n• Room types & availability\n• Check-in & check-out times\n• Dining hours & menu info\n• Conference & event facilities\n• Payments, Wi-Fi & amenities\n• Location & transport\n• Bookings & pricing\n• Special occasions & more!\n\nJust ask away!',
  },

  // ── Contact & About ─────────────────────────────────────────────────────
  {
    keywords: ['contact','phone','call','email','reach','telephone','number','reception','front desk'],
    answer: `Our reception is open **24/7**:\n\n📞 ${PHONE_1}\n📞 ${PHONE_2}\n✉️ ${EMAIL}\n\nOr WhatsApp us for a quick response.`,
  },
  {
    keywords: ['whatsapp','whats app','wa','message us','text us','chat with us'],
    answer: `WhatsApp us at **${PHONE_1}** — we typically respond within minutes during business hours.`,
  },
  {
    keywords: ['location','address','where are you','how to get','directions','map','find you','where is hotel itoya'],
    answer: `We are on **Town Centre Road, Busia, Kenya** — right near the Kenya-Uganda border.\n\n• From Nairobi: ~7 hrs via A104\n• From Kisumu: ~1.5 hrs via A1\n• From Kampala: ~2 hrs via A109`,
  },
  {
    keywords: ['ayoti','ayoti group','who owns','management','parent company','owner'],
    answer: 'Hotel Itoya is proudly part of the **Ayoti Group** — a trusted hospitality and business group operating across East Africa.',
  },
  {
    keywords: ['about','tell me about','what is hotel itoya','hotel itoya','overview'],
    answer: 'Hotel Itoya is a **premier business hotel** in Busia, Kenya — on the Kenya-Uganda border. We offer 60+ rooms, a full-service restaurant, conference facilities, spa, gym, event services, and more, all under the Ayoti Group.',
  },
];

// ── Social reply sets ────────────────────────────────────────────────────────
const GREETING_REPLIES = [
  `${getGreeting()}! Great to hear from you. How can I help you today? Feel free to ask about our rooms, dining, conference facilities, or anything else.`,
  `${getGreeting()}! Welcome to Hotel Itoya. What can I assist you with today?`,
  `${getGreeting()}! Happy to help. Ask me anything about Hotel Itoya — rooms, dining, events, location, and more.`,
];

const exact = (list, lower) =>
  list.some(w => lower === w || lower === w + '!' || lower === w + '.' || lower === w + '?');

// Weighted scoring: longer keyword phrases are more specific and score higher
const findAnswer = (question) => {
  const lower = question.toLowerCase().trim();
  if (!lower) return null;

  if (exact(GREETINGS, lower))
    return GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];
  if (exact(FAREWELLS, lower))
    return 'Goodbye! We look forward to welcoming you at Hotel Itoya. Have a wonderful day!';
  if (exact(THANKS, lower))
    return "You're most welcome! Is there anything else I can help you with?";
  if (exact(AFFIRMATIONS, lower))
    return 'Great! Feel free to ask if you need anything else about Hotel Itoya.';
  if (exact(NEGATIONS, lower))
    return 'No problem at all! Feel free to reach out anytime — we look forward to welcoming you at Hotel Itoya.';

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
                    className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary hover:text-white transition-all"
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
