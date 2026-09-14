/**
 * Tech Wash AI Conversational Assistant & Intelligent Concierge Engine
 * - Natural Language Semantic Intent Classifier & Rich Payload Generator
 * - Synchronized with live official pricing (Dry Cleaning from ₹40, Ironing from ₹12, Per-Kg from ₹100, Shoes ₹350, Curtains ₹30/sqft)
 * - Deep fabric chemistry, stain removal protocols, turnaround times, and order tracking
 * - Returns structured typed UI payloads (BOOKING_STEPPER, SERVICES_CAROUSEL, SERVICE_DETAIL, PRICING_TABLE, ORDER_TRACKING, FAQ_ACCORDION, CONTACT_CARD, TEXT_CONVERSATIONAL)
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
  whatsappFallbackPhone: '+91 89777 69866',
};

export const QUICK_ITEMS_CATALOG = [
  // Men's Wear
  { id: 'qi-m1', name: 'Shirt / T-Shirt', category: 'Men', unitPrice: 40, ironingPrice: 12, emoji: '👕', desc: 'Hydrocarbon dry clean or steam press' },
  { id: 'qi-m2', name: 'Trousers / Jeans', category: 'Men', unitPrice: 40, ironingPrice: 12, emoji: '👖', desc: 'Crease retention steam press' },
  { id: 'qi-m3', name: 'Kurta / Pyjama', category: 'Men', unitPrice: 90, ironingPrice: 20, emoji: '🥻', desc: 'Gentle bio-enzyme wash & press' },
  { id: 'qi-m4', name: 'Blazer / Coat', category: 'Men', unitPrice: 200, ironingPrice: 60, emoji: '🧥', desc: '3D mannequin form tension press' },
  { id: 'qi-m5', name: 'Suit (2-Piece)', category: 'Men', unitPrice: 250, ironingPrice: 90, emoji: '👔', desc: 'Zero shine PERC-free solvent clean' },
  { id: 'qi-m6', name: 'Sherwani / Indo-Western', category: 'Men', unitPrice: 350, ironingPrice: 120, emoji: '✨', desc: 'Zari embroidery protective wrap' },
  { id: 'qi-m7', name: 'Winter Jacket / Sweater', category: 'Men', unitPrice: 150, ironingPrice: 40, emoji: '🧥', desc: 'Fiber relaxation & de-pilling' },

  // Women's Wear & Ethnic
  { id: 'qi-w1', name: 'Top / Blouse / Shirt', category: 'Women', unitPrice: 40, ironingPrice: 12, emoji: '👚', desc: 'Delicate fabric treatment' },
  { id: 'qi-w2', name: 'Kurti / Tunic', category: 'Women', unitPrice: 50, ironingPrice: 15, emoji: '👗', desc: 'Soft-water wash & steam finish' },
  { id: 'qi-w3', name: 'Silk / Pattu Saree', category: 'Women', unitPrice: 120, ironingPrice: 60, emoji: '🥻', desc: 'Natural luster restoration & starching' },
  { id: 'qi-w4', name: 'Designer / Heavy Work Saree', category: 'Women', unitPrice: 180, ironingPrice: 80, emoji: '✨', desc: 'Zari protection & micro-spotting' },
  { id: 'qi-w5', name: 'Salwar Kameez (Set)', category: 'Women', unitPrice: 100, ironingPrice: 30, emoji: '🥻', desc: 'Demineralized color-safe cleanse' },
  { id: 'qi-w6', name: 'Casual Dress / Gown', category: 'Women', unitPrice: 150, ironingPrice: 50, emoji: '👗', desc: '3D form vertical steam finish' },
  { id: 'qi-w7', name: 'Heavy Bridal Lehenga (3-Pc)', category: 'Women', unitPrice: 500, ironingPrice: 180, emoji: '👰', desc: 'Heirloom couture preservation' },

  // Per-Kg Laundry (RO Soft Water)
  { id: 'qi-kg1', name: "Wash & Iron (Men's Clothes)", category: 'Per-Kg', unitPrice: 130, unit: 'per Kg', emoji: '🫧', desc: 'RO water wash + 3D steam press' },
  { id: 'qi-kg2', name: "Wash & Iron (Women's Clothes)", category: 'Per-Kg', unitPrice: 160, unit: 'per Kg', emoji: '🫧', desc: 'Delicate RO soft wash + steam press' },
  { id: 'qi-kg3', name: "Wash & Fold (Men's Clothes)", category: 'Per-Kg', unitPrice: 100, unit: 'per Kg', emoji: '👕', desc: 'Isolated drum wash + hand folding' },
  { id: 'qi-kg4', name: "Wash & Fold (Women's Clothes)", category: 'Per-Kg', unitPrice: 130, unit: 'per Kg', emoji: '👕', desc: 'Hypoallergenic bio-enzyme wash' },

  // Household & Furnishings
  { id: 'qi-h1', name: 'Curtains (Standard / Blackout)', category: 'Household', unitPrice: 30, unit: 'per sq. ft.', emoji: '🪟', desc: 'Ultrasonic dust extraction & steam press' },
  { id: 'qi-h2', name: 'Carpet / Rug Shampoo', category: 'Household', unitPrice: 45, unit: 'per sq. ft.', emoji: '🧶', desc: 'Deep rotary shampoo & moisture lift' },
  { id: 'qi-h3', name: 'Single Bedsheet & Pillow Covers', category: 'Household', unitPrice: 80, ironingPrice: 25, emoji: '🛏️', desc: 'High-temp sanitization & flat iron' },
  { id: 'qi-h4', name: 'Double Bedsheet Set', category: 'Household', unitPrice: 120, ironingPrice: 40, emoji: '🛏️', desc: 'Deep hygiene wash & hotel-grade press' },
  { id: 'qi-h5', name: 'Single Blanket / Quilt', category: 'Household', unitPrice: 200, emoji: '🛋️', desc: 'Thermal anti-mite deep cleaning' },
  { id: 'qi-h6', name: 'Double / Heavy Quilt (Razai)', category: 'Household', unitPrice: 300, emoji: '🛋️', desc: 'Antibacterial sterilization & fluffing' },

  // Footwear
  { id: 'qi-s1', name: 'Sneakers & Casual Shoes', category: 'Footwear', unitPrice: 350, unit: 'per pair', emoji: '👟', desc: 'Midsole whitening & UV disinfection' },
  { id: 'qi-s2', name: 'Sports & Running Shoes', category: 'Footwear', unitPrice: 350, unit: 'per pair', emoji: '🏃', desc: 'Deep mesh scrubbing & odor removal' },
  { id: 'qi-s3', name: 'Formal Leather Shoes', category: 'Footwear', unitPrice: 350, unit: 'per pair', emoji: '👞', desc: 'Leather conditioning & cream buffing' },
  { id: 'qi-s4', name: 'Suede Shoes & Boots', category: 'Footwear', unitPrice: 350, unit: 'per pair', emoji: '🥾', desc: 'Suede nap restoration & water repellent' },
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
    // INTENT 1: DIRECT BOOKING / SCHEDULE DOORSTEP PICKUP
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('book') || 
      text.includes('pickup') || 
      text.includes('schedule') || 
      text.includes('doorstep') || 
      text.includes('collect') ||
      text === 'booking_start'
    ) {
      // Check if user specifically requested a service (e.g. "Book Ironing", "Book Dry Cleaning", "Book Shoes")
      const requestedService = services.find(
        (s) => text.includes(s.title.toLowerCase()) || text.includes(s.slug) || (s.category && text.includes(s.category.toLowerCase()))
      );

      return {
        type: 'BOOKING_STEPPER',
        text: requestedService
          ? `I'd love to schedule a pickup for **${requestedService.title}**! You can confirm details below or jump straight to the booking page:`
          : "I'd be delighted to arrange a doorstep pickup for your garments! Follow these quick steps to schedule your slot:",
        payload: {
          services: services.slice(0, 8),
          quickItems: QUICK_ITEMS_CATALOG,
          initialService: requestedService || services[0],
        },
        actionLabel: requestedService ? `Open Full Booking for ${requestedService.title}` : 'Open Booking Wizard',
        actionUrl: requestedService ? `/book-pickup?service=${requestedService.slug}` : '/book-pickup',
        contextPills: [
          { label: '⚡ 24H Express Pickup', value: 'What is Express turnaround?' },
          { label: '💰 Check Price List', value: 'Calculate Garment Pricing' },
          { label: '📍 Service Areas', value: 'Which areas do you cover?' },
          { label: '💬 WhatsApp Support', value: 'Speak with support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 2: ORDER TRACKING & STATUS LOOKUP
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('track') || 
      text.includes('status') || 
      text.includes('where is my order') || 
      text.includes('tw-') ||
      text.includes('order id') ||
      text.includes('tracking')
    ) {
      // Check if user provided an Order ID (e.g. TW-123456 or 6-digit number)
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
            { label: '📍 View Pickup Details', value: 'Show pickup location details' },
            { label: '📞 Contact Delivery Rider', value: 'Speak to Human Support' },
            { label: '📦 Book Another Pickup', value: 'Book a Doorstep Pickup' },
          ],
        };
      }

      return {
        type: 'ORDER_TRACKING_PROMPT',
        text: "Please share your 6-digit Order ID (e.g. **TW-102948**) or tap below to open our live real-time tracker:",
        payload: {},
        actionLabel: 'Open Live Order Tracker ↗',
        actionUrl: '/track-order',
        contextPills: [
          { label: '📦 Book New Pickup', value: 'Book a Doorstep Pickup' },
          { label: '💰 Check Pricing', value: 'Calculate Garment Pricing' },
          { label: '📞 Speak with Support', value: 'Speak to Human Support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 3: SPECIFIC APPAREL / ITEM PRICE INQUIRIES
    // ─────────────────────────────────────────────────────────────
    const matchingItem = QUICK_ITEMS_CATALOG.find((item) => {
      const nameTerms = item.name.toLowerCase().split(/[\s/()]+/);
      return nameTerms.some(term => term.length > 2 && text.includes(term));
    });

    if (
      matchingItem && (
        text.includes('price') || 
        text.includes('cost') || 
        text.includes('rate') || 
        text.includes('how much') ||
        text.includes('charge') ||
        text.includes('wash') ||
        text.includes('clean') ||
        text.includes('iron')
      )
    ) {
      const isIroningQuery = text.includes('iron') || text.includes('press');
      const applicableRate = isIroningQuery && matchingItem.ironingPrice 
        ? matchingItem.ironingPrice 
        : matchingItem.unitPrice;
      const serviceName = isIroningQuery && matchingItem.ironingPrice ? '3D Steam Ironing' : 'Hydrocarbon Dry Cleaning / Care';

      return {
        type: 'TEXT_CONVERSATIONAL',
        text: `✨ **${matchingItem.name}** is **${formatCurrency(applicableRate)}** ${matchingItem.unit || 'per piece'} for ${serviceName}.\n\n` +
              `• **Treatment**: ${matchingItem.desc}\n` +
              `• **Turnaround**: Standard 48 hrs (Express 24 hrs available)\n` +
              `• **Doorstep Pickup**: Complimentary on orders above ₹499!`,
        payload: { item: matchingItem },
        actionLabel: `Book Pickup for ${matchingItem.name}`,
        actionUrl: `/book-pickup`,
        contextPills: [
          { label: `📦 Book ${matchingItem.name}`, value: `Book pickup for ${matchingItem.name}` },
          { label: '💰 View Full Rate Card', value: 'Calculate Garment Pricing' },
          { label: '⚡ Express Speed Option', value: 'What is Express turnaround?' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 4: STAIN REMOVAL & FABRIC CARE ADVISORY
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('stain') || 
      text.includes('spot') || 
      text.includes('wine') || 
      text.includes('coffee') || 
      text.includes('tea') || 
      text.includes('ink') || 
      text.includes('oil') || 
      text.includes('grease') || 
      text.includes('turmeric') || 
      text.includes('haldi') || 
      text.includes('blood') ||
      text.includes('color bleed') ||
      text.includes('delicate') ||
      text.includes('silk') ||
      text.includes('zari')
    ) {
      return {
        type: 'TEXT_CONVERSATIONAL',
        text: "🎯 **Stain & Fabric Advisory from our Care Specialists:**\n\n" +
              "1. **Zero Harsh Scrubbing**: We use European ultrasonic micro-spotters with targeted bio-enzymes to lift oil, grease, wine, and food stains without fiber stress.\n" +
              "2. **Color-Fast Guarantee**: 100% RO demineralized water prevents mineral crystallization, fading, and yellowing.\n" +
              "3. **Delicate Silks & Zari**: Pattu sarees, sherwanis, and bridal couture receive isolated hydrocarbon baths with hardware/button wraps.\n\n" +
              "💡 *Tip: Please avoid rubbing stains with water or soap at home, as this can set tannins deep into the weave.*",
        payload: {},
        actionLabel: 'Schedule Stain Treatment Pickup',
        actionUrl: '/book-pickup?service=dry-cleaning',
        contextPills: [
          { label: '📦 Book Dry Cleaning', value: 'Book Dry Cleaning' },
          { label: '💰 Check Dry Clean Rates', value: 'Calculate Garment Pricing' },
          { label: '📞 Talk to Care Specialist', value: 'Speak to Human Support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 5: TURNAROUND TIME & 24H EXPRESS DELIVERY
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('time') || 
      text.includes('hours') || 
      text.includes('turnaround') || 
      text.includes('how long') || 
      text.includes('express') || 
      text.includes('urgent') || 
      text.includes('same day') || 
      text.includes('fast') ||
      text.includes('emergency')
    ) {
      return {
        type: 'TEXT_CONVERSATIONAL',
        text: "⏱️ **Turnaround Speeds & Delivery Options:**\n\n" +
              "• **Standard Care (48 Hours)**: Thorough fiber inspection, RO soft-water bath, slow low-heat drying, and 3D form tension steam pressing.\n" +
              "• **⚡ 24-Hour Express Speed**: Dedicated priority lab queue for urgent meetings, flights, or weddings (+₹99 flat or nominal rush charge).\n" +
              "• **Doorstep Schedule**: Pickup slots available 7:00 AM – 9:00 PM daily with live tracking and SMS/WhatsApp updates.",
        payload: {},
        actionLabel: 'Book 24H Express Pickup',
        actionUrl: '/book-pickup',
        contextPills: [
          { label: '📦 Schedule Pickup', value: 'Book a Doorstep Pickup' },
          { label: '💰 View Price Card', value: 'Calculate Garment Pricing' },
          { label: '💬 WhatsApp Assistant', value: 'Speak to Human Support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 6: COUPONS & PROMOTIONAL OFFERS
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('coupon') || 
      text.includes('promo') || 
      text.includes('offer') || 
      text.includes('discount') || 
      text.includes('code') || 
      text.includes('deal') ||
      text.includes('welcome')
    ) {
      return {
        type: 'TEXT_CONVERSATIONAL',
        text: "🎉 **Active Tech Wash Offers & Promo Codes:**\n\n" +
              "1. **`TECHWASH20`** — Flat **20% OFF** on your entire dry cleaning or laundry order (Max discount ₹200).\n" +
              "2. **`WELCOME50`** — Flat **₹50 OFF** on your first doorstep pickup.\n" +
              "3. **🚚 Free Doorstep Pickup & Delivery** — Automatically applied on all orders above ₹499!\n\n" +
              "You can enter either code directly in your order summary during checkout.",
        payload: {},
        actionLabel: 'Apply Promo & Book Pickup',
        actionUrl: '/book-pickup?coupon=TECHWASH20',
        contextPills: [
          { label: '✨ Use TECHWASH20 (20% Off)', value: 'Book a Doorstep Pickup' },
          { label: '💰 Check Garment Rates', value: 'Calculate Garment Pricing' },
          { label: '👗 Explore Services', value: 'Explore Cleaning Services' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 7: SERVICE COVERAGE, CITIES & PINCODES
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('area') || 
      text.includes('location') || 
      text.includes('city') || 
      text.includes('where') || 
      text.includes('pincode') || 
      text.includes('hyderabad') || 
      text.includes('madhapur') || 
      text.includes('gachibowli') || 
      text.includes('hitec') || 
      text.includes('banjara') || 
      text.includes('jubilee') || 
      text.includes('kondapur') || 
      text.includes('kukatpally') || 
      text.includes('secunderabad') || 
      text.includes('tirupati') ||
      text.includes('bengaluru')
    ) {
      return {
        type: 'TEXT_CONVERSATIONAL',
        text: "📍 **Doorstep Coverage & Service Hubs:**\n\n" +
              "We provide certified doorstep pickup and drop across all major localities:\n" +
              "• **Hyderabad & Secunderabad**: Hitec City, Madhapur, Gachibowli, Jubilee Hills, Banjara Hills, Kondapur, Kukatpally, Begumpet, Manikonda, Financial District & beyond.\n" +
              "• **Tirupati & Bengaluru Hubs**: Daily scheduled morning and evening runs.\n" +
              "• **Free Pickup**: 100% complimentary on all orders above ₹499.\n\n" +
              "Our pickup executive detects your GPS location or address automatically at checkout!",
        payload: { locations },
        actionLabel: 'View Hub Locations & Coverage',
        actionUrl: '/locations',
        contextPills: [
          { label: '📦 Book Doorstep Pickup', value: 'Book a Doorstep Pickup' },
          { label: '💰 Check Price List', value: 'Calculate Garment Pricing' },
          { label: '📞 Check My Pincode on Call', value: 'Speak to Human Support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 8: PAYMENTS, UPI & GST INVOICING
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('pay') || 
      text.includes('upi') || 
      text.includes('qr') || 
      text.includes('google pay') || 
      text.includes('phonepe') || 
      text.includes('paytm') || 
      text.includes('cash') || 
      text.includes('cod') || 
      text.includes('bill') || 
      text.includes('invoice') || 
      text.includes('gst')
    ) {
      return {
        type: 'TEXT_CONVERSATIONAL',
        text: "💳 **Payment Methods & Billing Transparency:**\n\n" +
              "• **Instant UPI QR Scan**: Scan the dynamic QR code on checkout or delivery using Google Pay, PhonePe, Paytm, or BHIM.\n" +
              "• **Cash on Delivery (COD)**: Pay our executive directly upon doorstep delivery.\n" +
              "• **Tax Invoices**: You receive an itemized GST invoice via WhatsApp and PDF download with every confirmed order.\n" +
              "• **No Hidden Fees**: Transparent rates with 5% GST clearly stated upfront.",
        payload: {},
        actionLabel: 'Book Pickup Now',
        actionUrl: '/book-pickup',
        contextPills: [
          { label: '📦 Book Pickup', value: 'Book a Doorstep Pickup' },
          { label: '💰 Rate Card', value: 'Calculate Garment Pricing' },
          { label: '💬 WhatsApp Support', value: 'Speak to Human Support' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 9: SERVICES MENU & INDIVIDUAL SERVICE DETAILS
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
      text.includes('carpet') ||
      text.includes('menu') ||
      text.includes('catalog')
    ) {
      const specificMatch = services.find(
        (s) => text.includes(s.title.toLowerCase()) || text.includes((s.category || '').toLowerCase()) || text.includes(s.slug)
      );

      if (specificMatch) {
        return {
          type: 'SERVICE_DETAIL',
          text: `Here are the care specifications and standards for **${specificMatch.title}**:`,
          payload: { service: specificMatch },
          actionLabel: `Book ${specificMatch.title} Directly`,
          actionUrl: `/book-pickup?service=${specificMatch.slug}`,
          contextPills: [
            { label: `📦 Book ${specificMatch.title}`, value: `Book ${specificMatch.title}` },
            { label: '👗 Other Services', value: 'Explore Cleaning Services' },
            { label: '💰 Rate Card', value: 'Calculate Garment Pricing' },
          ],
        };
      }

      return {
        type: 'SERVICES_CAROUSEL',
        text: "We offer specialized fabric care across multiple laboratory-calibrated categories. Swipe through our menu:",
        payload: { services },
        contextPills: [
          { label: '📦 Book Doorstep Pickup', value: 'Book a Doorstep Pickup' },
          { label: '💰 Check Price List', value: 'Calculate Garment Pricing' },
          { label: '⚡ 24H Express Delivery', value: 'What is Express turnaround?' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 10: COMPLETE PRICING & RATE LIST
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('price') || 
      text.includes('cost') || 
      text.includes('rate') || 
      text.includes('how much') ||
      text.includes('tariff') ||
      text.includes('charges')
    ) {
      return {
        type: 'PRICING_TABLE',
        text: "Here is our transparent rate card. All prices include RO soft-water treatment, eco-detergents, and 3D steam finishing:",
        payload: { items: QUICK_ITEMS_CATALOG },
        contextPills: [
          { label: '📦 Schedule Pickup', value: 'Book a Doorstep Pickup' },
          { label: '✨ 20% Off Coupon', value: 'What are the current promo offers?' },
          { label: '👗 Explore Services', value: 'Explore Cleaning Services' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 11: FAQS & CARE ADVICE
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('faq') || 
      text.includes('how it works') || 
      text.includes('solvent') || 
      text.includes('perc') || 
      text.includes('safe') ||
      text.includes('baby') ||
      text.includes('hygiene')
    ) {
      return {
        type: 'FAQ_ACCORDION',
        text: "Here are answers to the most common questions about our fabric care, solvents, and turnaround times:",
        payload: {
          faqs: faqs.length > 0 ? faqs.slice(0, 5) : [
            { question: 'What makes hydrocarbon dry cleaning different from regular PERC dry cleaners?', answer: 'Traditional dry cleaners use PERC (Perchloroethylene), a toxic solvent that degrades fabric fibers and leaves a chemical odor. We use European eco-hydrocarbon solvents that are gentle on fabrics, 100% skin-safe, and completely odorless.' },
            { question: 'What is the standard turnaround time?', answer: 'Standard turnaround is 48 hours with slow moisture-controlled drying. Express 24-hour delivery is also available on request.' },
            { question: 'Do you provide free doorstep pickup and delivery?', answer: 'Yes, doorstep pickup and delivery is 100% complimentary on all orders above ₹499 across all service hubs.' },
            { question: 'How are expensive silk sarees and bridal lehengas treated?', answer: 'Delicate ethnic couture is processed in dedicated micro-solvent baths, with custom button and embroidery protection wraps, and finished on tension steam forms.' },
            { question: 'Do you mix my clothes with other customers?', answer: 'Never. Every client order is processed in isolated, dedicated wash and dry cycles to ensure 100% personal hygiene.' }
          ]
        },
        contextPills: [
          { label: '📦 Book Doorstep Pickup', value: 'Book a Doorstep Pickup' },
          { label: '📞 Speak with Concierge', value: 'Speak to Human Support' },
          { label: '💰 Check Price List', value: 'Calculate Garment Pricing' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 12: HUMAN SUPPORT & WHATSAPP / CALL HANDOVER
    // ─────────────────────────────────────────────────────────────
    if (
      text.includes('human') || 
      text.includes('support') || 
      text.includes('agent') || 
      text.includes('call') || 
      text.includes('phone') || 
      text.includes('whatsapp') || 
      text.includes('help') ||
      text.includes('contact') ||
      text.includes('number') ||
      text.includes('customer care')
    ) {
      return {
        type: 'CONTACT_CARD',
        text: "Our fabric care specialists are available for bespoke garment inquiries, stain consultations, and instant booking help:",
        payload: {
          phone: settings?.general?.primaryPhone || '+91 89777 69866',
          whatsapp: settings?.general?.whatsappNumber || '+91 89777 69866',
          email: settings?.general?.supportEmail || 'care@techwash.in',
        },
        contextPills: [
          { label: '📦 Book Online', value: 'Book a Doorstep Pickup' },
          { label: '👗 View Services', value: 'Explore Cleaning Services' },
          { label: '💰 Check Rates', value: 'Calculate Garment Pricing' },
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // DEFAULT FRIENDLY CONVERSATIONAL RESPONSE
    // ─────────────────────────────────────────────────────────────
    return {
      type: 'TEXT_CONVERSATIONAL',
      text: "👋 Hello! I am your **Tech Wash Concierge**.\n\nI can help you with:\n• 📦 **Scheduling doorstep pickup & delivery**\n• 💰 **Checking prices for specific clothes & services**\n• 🔍 **Real-time order tracking (e.g. TW-102948)**\n• ✨ **Stain removal & delicate fabric advisory**\n\nHow can I help your wardrobe today?",
      payload: {},
      contextPills: [
        { label: '📦 Book a Pickup', value: 'Book a Doorstep Pickup' },
        { label: '👗 Explore Services', value: 'Explore Cleaning Services' },
        { label: '💰 Check Price List', value: 'Calculate Garment Pricing' },
        { label: '⚡ 24H Express Options', value: 'What is Express turnaround?' },
        { label: '📍 Service Areas', value: 'Which areas do you cover?' },
      ],
    };
  },
};

