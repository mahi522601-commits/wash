/**
 * Dynamic Offers, Promotions & First-Visit Popup Service for Tech Wash
 * Sourced from Firebase Firestore and LocalStorage with real-time updates and analytics
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { analyticsService } from './analyticsService.js';

const OFFERS_STORAGE_KEY = 'techwash_active_offers';
const POPUP_CONFIG_KEY = 'techwash_offer_popup_config';
const OFFER_ANALYTICS_KEY = 'techwash_offer_analytics';

export const DEFAULT_POPUP_CONFIG = {
  enabled: true,
  cooldown: 'session', // 'session' | 'daily' | 'always'
  delayMs: 1000,
  showOnMobile: true,
  showOnDesktop: true,
  showImage: false,
};

export const DEFAULT_OFFERS = [
  {
    id: 'off-1',
    code: 'TECHWASH20',
    title: 'First Order Welcome Special',
    badgeText: '✨ LIMITED OFFER',
    discountType: 'percentage',
    discountValue: '20% OFF',
    discountNum: 20,
    shortDescription: 'Premium garment care for your first booking.',
    minOrder: '₹299',
    maxDiscount: '₹200',
    validTill: 'Valid on first order',
    featured: true,
    priority: 1,
    associatedServiceSlug: 'premium-dry-cleaning',
    active: true,
    showInPopup: true,
  },
  {
    id: 'off-2',
    code: 'EXPRESSFREE',
    title: 'Complimentary 24-Hr Express Upgrade',
    badgeText: '⚡ POPULAR',
    discountType: 'express_upgrade',
    discountValue: 'FREE Express Turnaround',
    discountNum: 99,
    shortDescription: 'Priority laboratory turnaround on all couture & linen orders above ₹999.',
    minOrder: '₹999',
    maxDiscount: '₹99',
    validTill: 'Limited Period',
    featured: false,
    priority: 2,
    associatedServiceSlug: 'eco-ro-soft-wash',
    active: true,
    showInPopup: false,
  },
  {
    id: 'off-3',
    code: 'COUTURE15',
    title: 'Bridal Lehenga & Silk Saree Spa',
    badgeText: '👑 COUTURE EXCLUSIVE',
    discountType: 'percentage',
    discountValue: '15% OFF Couture',
    discountNum: 15,
    shortDescription: 'Dedicated micro-solvent treatment for heavy bridal lehengas and pure silk.',
    minOrder: '₹1499',
    maxDiscount: '₹300',
    validTill: 'Festive Season',
    featured: false,
    priority: 3,
    associatedServiceSlug: 'pure-silk-saree-spa',
    active: true,
    showInPopup: false,
  },
];

export const offerService = {
  /**
   * Get all active offers with priority sorting
   */
  async getActiveOffers() {
    let list = [];

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'offers'));
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Firestore offers read error:", e);
      }
    }

    if (list.length === 0) {
      try {
        const stored = localStorage.getItem(OFFERS_STORAGE_KEY);
        list = stored ? JSON.parse(stored) : DEFAULT_OFFERS;
      } catch (e) {
        list = DEFAULT_OFFERS;
      }
    }

    // Filter active and sort by priority
    return list
      .filter(o => o.active !== false)
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  },

  /**
   * Get the primary featured offer for the first-visit popup
   */
  async getFeaturedPopupOffer() {
    const offers = await this.getActiveOffers();
    const popupOffers = offers.filter(o => o.showInPopup !== false);
    if (popupOffers.length === 0) return offers[0] || DEFAULT_OFFERS[0];

    const featured = popupOffers.find(o => o.featured);
    return featured || popupOffers[0];
  },

  /**
   * Get First-Visit Popup Configuration
   */
  async getPopupConfig() {
    try {
      const stored = localStorage.getItem(POPUP_CONFIG_KEY);
      return stored ? { ...DEFAULT_POPUP_CONFIG, ...JSON.parse(stored) } : DEFAULT_POPUP_CONFIG;
    } catch {
      return DEFAULT_POPUP_CONFIG;
    }
  },

  /**
   * Save First-Visit Popup Configuration
   */
  async savePopupConfig(config) {
    localStorage.setItem(POPUP_CONFIG_KEY, JSON.stringify(config));
    return config;
  },

  /**
   * Save / Update offers in CMS
   */
  async saveOffers(offersList) {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offersList));

    if (isFirebaseConfigured && db) {
      for (const item of offersList) {
        try {
          await setDoc(doc(db, 'offers', item.id), item);
        } catch (e) {
          console.warn("Firestore offer save error:", e);
        }
      }
    }

    return offersList;
  },

  /**
   * Analytics event tracking for offer popup
   */
  trackImpression(offerCode) {
    this._incrementMetric(offerCode, 'impressions');
    analyticsService.trackEvent('offer_popup_impression', { offerCode });
  },

  trackCopy(offerCode) {
    this._incrementMetric(offerCode, 'copies');
    analyticsService.trackEvent('offer_code_copied', { offerCode });
  },

  trackBooking(offerCode) {
    this._incrementMetric(offerCode, 'bookings');
    analyticsService.trackEvent('offer_booking_click', { offerCode });
  },

  trackClose(offerCode) {
    this._incrementMetric(offerCode, 'closes');
    analyticsService.trackEvent('offer_popup_closed', { offerCode });
  },

  _incrementMetric(offerCode, metricKey) {
    try {
      const data = JSON.parse(localStorage.getItem(OFFER_ANALYTICS_KEY) || '{}');
      if (!data[offerCode]) {
        data[offerCode] = { impressions: 0, copies: 0, bookings: 0, closes: 0 };
      }
      data[offerCode][metricKey] = (data[offerCode][metricKey] || 0) + 1;
      localStorage.setItem(OFFER_ANALYTICS_KEY, JSON.stringify(data));
    } catch (e) {}
  },

  getAnalytics() {
    try {
      return JSON.parse(localStorage.getItem(OFFER_ANALYTICS_KEY) || '{}');
    } catch {
      return {};
    }
  }
};
