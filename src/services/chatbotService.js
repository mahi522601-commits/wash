/**
 * Tech Wash AI Conversational Assistant & Concierge Engine
 * - Structured intent classifier & payload generator
 * - Fetches live published data from CMS (Services, Pricing, FAQs, Settings, Locations)
 * - Returns rich typed UI payloads (SERVICES, SERVICE_DETAIL, PRICING, BOOKING, TRACKING, FAQ, CONTACT, TEXT)
 */
import { serviceService } from './serviceService.js';
import { settingsService } from './settingsService.js';
import { cmsService } from './cmsService.js';
import { orderService } from './orderService.js';
import { formatCurrency } from '../utils/formatters.js';

const CHATBOT_CONFIG_KEY = 'techwash_chatbot_config';

export const DEFAULT_CHATBOT_CONFIG = {
  enabled: true,
  botName: 'Tech Wash Concierge',
  welcomeMessage: "Hello! I am your Tech Wash Concierge. How can I assist with your garment care today?",
  workingHoursText: 'Available 24/7 for instant assistance & bookings',
  whatsappFallbackPhone: '+91 98765 43210',
};

export const QUICK_ITEMS_CATALOG = [
  { id: 'qi-1', name: 'Shirts / T-Shirts', unitPrice: 49, category: 'Apparel', icon: 'Shirt' },
  { id: 'qi-2', name: 'Trousers / Jeans', unitPrice: 59, category: 'Apparel', icon: 'Layers' },
  { id: 'qi-3', name: 'Suit / Blazer (2-Pc)', unitPrice: 399, category: 'Couture', icon: 'Sparkles' },
  { id: 'qi-4', name: 'Silk Saree / Kurta', unitPrice: 299, category: 'Ethnic', icon: 'Sparkles' },
  { id: 'qi-5', name: 'Bedsheet & Linens', unitPrice: 129, category: 'Household', icon: 'Home' },
  { id: 'qi-6', name: 'Sneakers / Leather Shoes', unitPrice: 299, category: 'Footwear', icon: 'Footprints' },
  { id: 'qi-7', name: 'Heavy Bridal Lehenga', unitPrice: 799, category: 'Couture', icon: 'Heart' },
  { id: 'qi-8', name: 'Curtains (Per Panel)', unitPrice: 199, category: 'Household', icon: 'Layers' },
];

export const chatbotService = {
  async getConfig() {
    try {
      const stored = localStorage.getItem(CHATBOT_CONFIG_KEY);
      return stored ? { ...DEFAULT_CHATBOT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CHATBOT_CONFIG;
    } catch {
      return DEFAULT_CHATBOT_CONFIG;
    }
  },

  async saveConfig(config) {
    try {
      localStorage.setItem(CHATBOT_CONFIG_KEY, JSON.stringify(config));
      return config;
    } catch (e) {
      console.warn("Failed to save chatbot config:", e);
      return config;
    }
  },

  /**
   * Process user intent and return structured component payload
   */
  async processMessage(userMessage, currentContext = {}) {
    const text = (userMessage || '').toLowerCase().trim();

    // 1. Fetch live published data from CMS
    const [services, locations, faqs, settings] = await Promise.all([
      serviceService.getServices({ publishedOnly: true }),
      settingsService.getLocations(),
      cmsService.getItems('faqs'),
      settingsService.getSettings(),
    ]);

    // ─────────────────────────────────────────────────────────────
    // INTENT 1: BOOKING / SCHEDULE PICKUP
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('book') || 
      text.includes('pickup') || 
      text.includes('schedule') || 
      text.includes('doorstep') || 
      text.includes('collect') ||
      text === 'booking_start'
    ) {
      return {
        type: 'BOOKING_STEPPER',
        text: "I'd be delighted to arrange a doorstep pickup for your garments! Follow these quick steps to lock your slot:",
        payload: {
          services: services.slice(0, 6),
          quickItems: QUICK_ITEMS_CATALOG,
        },
        contextPills: [
          { label: '⚡ 24H Express', value: 'What is Express turnaround?' },
          { label: '📍 Service Areas', value: 'Which areas do you cover?' },
          { label: '💬 Talk to Agent', value: 'Speak with support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 2: ORDER TRACKING & STATUS
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('track') || 
      text.includes('status') || 
      text.includes('where is my order') || 
      text.includes('tw-') ||
      text.includes('order id')
    ) {
      // Check if user provided an Order ID (e.g. TW-123456)
      const orderIdMatch = text.match(/tw-\d+/i) || text.match(/\b\d{6}\b/);
      let foundOrder = null;

      if (orderIdMatch) {
        const queryId = orderIdMatch[0].toUpperCase().startsWith('TW-') 
          ? orderIdMatch[0].toUpperCase() 
          : `TW-${orderIdMatch[0]}`;
        foundOrder = await orderService.getOrderById(queryId);
      }

      if (foundOrder) {
        return {
          type: 'ORDER_TRACKING',
          text: `Here is the real-time milestone progression for order **#${foundOrder.orderNumber}**:`,
          payload: { order: foundOrder },
          contextPills: [
            { label: '📍 View Doorstep Map', value: 'Show pickup location map' },
            { label: '🖨️ Tax Invoice', value: 'Open tax invoice' },
            { label: '📞 Call Courier', value: 'Call delivery rider' },
          ],
        };
      }

      return {
        type: 'ORDER_TRACKING_PROMPT',
        text: "Please share your 6-digit Order ID (e.g. TW-102948) or tap below to look up your order:",
        payload: {},
        actionLabel: 'Open Order Tracker',
        actionUrl: '/track-order',
        contextPills: [
          { label: '📦 Book New Pickup', value: 'Book a Doorstep Pickup' },
          { label: '📞 Contact Support', value: 'Speak to Human Support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 3: SERVICES INQUIRY & DISCOVERY
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('service') || 
      text.includes('dry clean') || 
      text.includes('steam') || 
      text.includes('wash') || 
      text.includes('iron') || 
      text.includes('saree') || 
      text.includes('shoe') ||
      text.includes('curtain') ||
      text.includes('lehenga') ||
      text.includes('leather')
    ) {
      const specificMatch = services.find(
        (s) => text.includes(s.title.toLowerCase()) || text.includes(s.category.toLowerCase()) || text.includes(s.slug)
      );

      if (specificMatch) {
        return {
          type: 'SERVICE_DETAIL',
          text: `Here are the care specifications for **${specificMatch.title}**:`,
          payload: { service: specificMatch },
          contextPills: [
            { label: `Book ${specificMatch.title}`, value: `Book ${specificMatch.title}` },
            { label: '👗 Other Services', value: 'Explore Cleaning Services' },
            { label: '💰 Price List', value: 'Calculate Garment Pricing' },
          ],
        };
      }

      return {
        type: 'SERVICES_CAROUSEL',
        text: "We offer specialized fabric care across multiple laboratory-calibrated categories. Swipe through our menu:",
        payload: { services },
        contextPills: [
          { label: '📦 Book Pickup', value: 'Book a Doorstep Pickup' },
          { label: '💰 Check Rates', value: 'Calculate Garment Pricing' },
          { label: '⚡ 45-Min Express', value: 'What is Express turnaround?' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 4: PRICING & RATE LIST
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('price') || 
      text.includes('cost') || 
      text.includes('rate') || 
      text.includes('how much') ||
      text.includes('tariff') ||
      text.includes('discount') ||
      text.includes('offer')
    ) {
      return {
        type: 'PRICING_TABLE',
        text: "Here is our transparent rate card. Prices include RO soft-water treatment, eco-detergents, and 3D steam finishing:",
        payload: { items: QUICK_ITEMS_CATALOG },
        contextPills: [
          { label: '📦 Schedule Pickup', value: 'Book a Doorstep Pickup' },
          { label: '✨ 20% Off Promo', value: 'What are the current promo offers?' },
          { label: '👗 Explore Services', value: 'Explore Cleaning Services' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 5: FAQS & CARE ADVICE
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('faq') || 
      text.includes('how it works') || 
      text.includes('solvent') || 
      text.includes('perc') || 
      text.includes('time') || 
      text.includes('hours') || 
      text.includes('turnaround') ||
      text.includes('safe')
    ) {
      return {
        type: 'FAQ_ACCORDION',
        text: "Here are answers to the most common questions about our fabric care and turnaround times:",
        payload: {
          faqs: faqs.length > 0 ? faqs.slice(0, 4) : [
            { question: 'What makes hydrocarbon dry cleaning different from regular dry cleaners?', answer: 'Traditional dry cleaners use PERC (Perchloroethylene), which is harsh and degrades fabric fibers over time. We use pure European hydrocarbon solvents that are gentle on fabrics, safe for the skin, and completely odorless.' },
            { question: 'What is the standard turnaround time?', answer: 'Standard turnaround is 48 hours with slow moisture drying. Express 24-hour delivery is also available on request.' },
            { question: 'Do you provide free doorstep pickup and delivery?', answer: 'Yes, doorstep pickup and delivery is complimentary on all orders above ₹499.' },
            { question: 'How are expensive silk sarees and bridal lehengas treated?', answer: 'Delicate ethnic couture is processed in dedicated micro-solvent baths, with custom button and embroidery protection wraps, and finished on tension steam forms.' },
          ]
        },
        contextPills: [
          { label: '📦 Book Doorstep Pickup', value: 'Book a Doorstep Pickup' },
          { label: '📞 Speak to Care Concierge', value: 'Speak to Human Support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 6: SERVICE AREA & LOCATIONS
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('area') || 
      text.includes('location') || 
      text.includes('city') || 
      text.includes('where') || 
      text.includes('pincode') || 
      text.includes('hyderabad') || 
      text.includes('tirupati')
    ) {
      return {
        type: 'SERVICE_AREA_INFO',
        text: "Tech Wash provides doorstep pickup across major hubs including Hyderabad, Secunderabad, Tirupati, and Bengaluru. Our certified fleet collects and delivers right at your doorstep.",
        payload: { locations },
        actionLabel: 'Check All Hubs & Stores',
        actionUrl: '/locations',
        contextPills: [
          { label: '📦 Book Pickup Now', value: 'Book a Doorstep Pickup' },
          { label: '💰 Check Price List', value: 'Calculate Garment Pricing' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 7: HUMAN SUPPORT & CONCIERGE HANDOVER
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('human') || 
      text.includes('support') || 
      text.includes('agent') || 
      text.includes('call') || 
      text.includes('phone') || 
      text.includes('whatsapp') || 
      text.includes('help')
    ) {
      return {
        type: 'CONTACT_CARD',
        text: "Our dedicated fabric concierge team is available to help with custom orders, stain consultations, or corporate inquiries:",
        payload: {
          phone: settings?.general?.primaryPhone || '+91 98765 43210',
          whatsapp: settings?.general?.whatsappNumber || '+91 98765 43210',
          email: settings?.general?.supportEmail || 'care@techwash.in',
        },
        contextPills: [
          { label: '📦 Book Online', value: 'Book a Doorstep Pickup' },
          { label: '👗 View Services', value: 'Explore Cleaning Services' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // DEFAULT CONVERSATIONAL RESPONSE
    // ─────────────────────────────────────────────────────────────
    return {
      type: 'TEXT_CONVERSATIONAL',
      text: "I can help you schedule a doorstep pickup, explore our garment care methods, check rates, or track an active order. What would you like to do?",
      payload: {},
      contextPills: [
        { label: '📦 Book a Pickup', value: 'Book a Doorstep Pickup' },
        { label: '👗 Explore Services', value: 'Explore Cleaning Services' },
        { label: '💰 Check Pricing', value: 'Calculate Garment Pricing' },
      ],
    };
  },
};
