/**
 * Global Settings & Business Information Service for Tech Wash
 * Controls branding, contact info, store locations, SEO, announcement banner, and maintenance mode.
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';

const SETTINGS_STORAGE_KEY = 'techwash_site_settings';
const LOCATIONS_STORAGE_KEY = 'techwash_store_locations';
const CONTACTS_STORAGE_KEY = 'techwash_contacts_data';

// Baseline default settings (pure structure, fully customizable from /admin/settings)
export const DEFAULT_SETTINGS = {
  general: {
    businessName: 'Tech Wash Laundry Services',
    tagline: 'Next-Generation Premium Garment Care & Express Doorstep Service',
    logoUrl: '/techwashlogo.webp',
    faviconUrl: '/techwashlogo.webp',
    supportEmail: 'support@techwash.in',
    primaryPhone: '+91 63048 45567',
    whatsappNumber: '+91 63048 45567',
    whatsappDefaultMessage: 'Hello Tech Wash, I would like to schedule a premium garment pickup.',
  },
  branding: {
    primaryColor: '#0284c7', // Brand 600
    accentColor: '#0ea5e9', // Brand 500
    royalColor: '#1d4ed8', // Royal 700
    buttonStyle: 'rounded-xl', // rounded-md, rounded-xl, rounded-full
    borderRadius: '16px',
    enableGlowEffects: true,
  },
  website: {
    maintenanceMode: false,
    announcementBarEnabled: true,
    announcementText: '✨ First Order Offer: Flat 20% OFF on Premium Dry Cleaning & Steam Ironing | Use Code: TECHWASH20',
    announcementLink: '/offers',
    floatingWhatsAppEnabled: true,
    showTrustStats: true,
    showVideoShowcase: true,
    showStoreLocations: true,
    showTestimonials: true,
    showBlogSection: true,
    showGallerySection: true,
    showFaqSection: true,
  },
  seo: {
    metaTitle: 'Tech Wash Laundry Services — Next-Gen Premium Garment Care & Dry Cleaning',
    metaDescription: 'Technology-driven laundry, eco-friendly dry cleaning, steam pressing, and shoe care with doorstep pickup and 24-hr express delivery.',
    keywords: 'laundry service, dry cleaning, steam ironing, shoe laundry, garment care, doorstep laundry pickup',
    ogImageUrl: '',
    canonicalUrl: 'https://techwash.in',
  },
  social: {
    instagram: 'https://instagram.com/techwashlaundry',
    facebook: 'https://facebook.com/techwashlaundry',
    youtube: 'https://youtube.com',
    googleBusiness: 'https://maps.google.com',
  },
  workingHours: {
    weekdays: '8:00 AM - 9:00 PM',
    weekends: '8:00 AM - 9:00 PM',
    weeklyHolidays: 'Open 7 Days a Week',
  }
};

export const DEFAULT_STORE_LOCATIONS = [
  {
    id: 'loc-jubilee-hills',
    name: 'Tech Wash Flagship Lounge — Jubilee Hills',
    address: 'Road No. 36, CBI Colony, Jubilee Hills, Hyderabad, Telangana 500033',
    phone: '+91 63048 45567',
    whatsapp: '+91 63048 45567',
    timings: '8:00 AM - 9:00 PM (All Days)',
    weeklyHolidays: 'Open 7 Days a Week',
    latitude: 17.4319,
    longitude: 78.4073,
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=17.4319,78.4073',
    isMain: true,
    active: true,
    posTerminalId: 'counter-1',
    posTerminalCode: 'TW-POS-01',
    assignedOperator: 'Rahul Verma (Cashier #1)',
    posPassword: 'techwash1',
    posMachineActive: true,
  },
  {
    id: 'loc-hitec-city',
    name: 'Tech Wash Express Hub — Hitec City',
    address: 'Near Cyber Towers, Madhapur, Hitec City, Hyderabad, Telangana 500081',
    phone: '+91 63048 45567',
    whatsapp: '+91 63048 45567',
    timings: '8:00 AM - 9:00 PM (All Days)',
    weeklyHolidays: 'Open 7 Days a Week',
    latitude: 17.4504,
    longitude: 78.3808,
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=17.4504,78.3808',
    isMain: false,
    active: true,
    posTerminalId: 'counter-2',
    posTerminalCode: 'TW-POS-02',
    assignedOperator: 'Sneha Reddy (Cashier #2)',
    posPassword: 'techwash2',
    posMachineActive: true,
  },
  {
    id: 'loc-banjara-hills',
    name: 'Tech Wash Care Center — Banjara Hills',
    address: 'Road No. 12, MLA Colony, Banjara Hills, Hyderabad, Telangana 500034',
    phone: '+91 63048 45567',
    whatsapp: '+91 63048 45567',
    timings: '8:00 AM - 9:00 PM (All Days)',
    weeklyHolidays: 'Open 7 Days a Week',
    latitude: 17.4156,
    longitude: 78.4350,
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=17.4156,78.4350',
    isMain: false,
    active: true,
    posTerminalId: 'counter-3',
    posTerminalCode: 'TW-POS-03',
    assignedOperator: 'Vikram Rao (Cashier #3)',
    posPassword: 'techwash3',
    posMachineActive: true,
  }
];

export const settingsService = {
  /**
   * Fetch site settings from Firestore or cache
   */
  async getSettings() {
    let settings = DEFAULT_SETTINGS;
    if (isFirebaseConfigured && db) {
      try {
        let snap = await getDoc(doc(db, 'settings', 'global'));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, 'settings', 'business'));
        }
        if (snap.exists()) {
          settings = { ...DEFAULT_SETTINGS, ...snap.data() };
        }
      } catch (e) {
        console.warn("Firestore settings read failed, using cached settings:", e);
      }
    } else {
      try {
        const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (cached) settings = JSON.parse(cached);
      } catch (e) {
        settings = DEFAULT_SETTINGS;
      }
    }

    if (!settings.general?.logoUrl) {
      settings.general = { ...settings.general, logoUrl: '/techwashlogo.webp' };
    }
    if (!settings.general?.faviconUrl) {
      settings.general = { ...settings.general, faviconUrl: '/techwashlogo.webp' };
    }
    return settings;
  },

  /**
   * Save site settings
   */
  async saveSettings(updatedSettings) {
    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'settings', 'global'), updatedSettings, { merge: true }),
          setDoc(doc(db, 'settings', 'business'), updatedSettings, { merge: true })
        ]);
      } catch (e) {
        console.warn("Firestore settings write failed, saving locally:", e);
      }
    }

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    return updatedSettings;
  },

  /**
   * Fetch all store/branch locations
   */
  async getLocations() {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'locations'));
        if (!snap.empty) {
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn("Firestore locations read error:", e);
      }
    }

    try {
      const cached = localStorage.getItem(LOCATIONS_STORAGE_KEY);
      return cached && JSON.parse(cached).length > 0 ? JSON.parse(cached) : DEFAULT_STORE_LOCATIONS;
    } catch (e) {
      return DEFAULT_STORE_LOCATIONS;
    }
  },

  /**
   * Save / Update store location
   */
  async saveLocation(locationData) {
    const locId = locationData.id || `loc-${Date.now()}`;
    const payload = { 
      ...locationData, 
      id: locId, 
      updatedAt: new Date().toISOString() 
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'locations', locId), payload, { merge: true });
      } catch (e) {
        console.warn("Firestore location save failed:", e);
      }
    }

    const locations = await this.getLocations();
    const index = locations.findIndex(l => l.id === locId);
    if (index >= 0) {
      locations[index] = payload;
    } else {
      locations.push(payload);
    }
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations));

    // Sync connected POS terminal
    try {
      const { terminalAuthService } = await import('./terminalAuthService.js');
      if (terminalAuthService?.syncTerminalFromLocation) {
        await terminalAuthService.syncTerminalFromLocation(payload);
      }
    } catch (e) {}

    // Dispatch update notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-locations-updated', { detail: payload }));
      try {
        if ('BroadcastChannel' in window) {
          const ch = new BroadcastChannel('techwash_locations_channel');
          ch.postMessage({ type: 'LOCATION_UPDATED', location: payload });
          setTimeout(() => { try { ch.close(); } catch (e) {} }, 200);
        }
      } catch (e) {}
    }

    return payload;
  },

  /**
   * Delete store location
   */
  async deleteLocation(locId) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'locations', locId));
      } catch (e) {
        console.warn("Firestore delete location error:", e);
      }
    }

    const locations = (await this.getLocations()).filter(l => l.id !== locId);
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations));

    // Sync connected POS terminal
    try {
      const { terminalAuthService } = await import('./terminalAuthService.js');
      if (terminalAuthService?.deleteTerminalForLocation) {
        await terminalAuthService.deleteTerminalForLocation(locId);
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-locations-updated', { detail: { id: locId, deleted: true } }));
    }

    return true;
  }
};
