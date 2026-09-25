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
    businessAddress: 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089',
    supportEmail: 'support@techwashlaundry.com',
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
    canonicalUrl: 'https://techwashlaundry.com',
  },
  social: {
    instagram: 'https://instagram.com/techwashlaundry',
    facebook: 'https://facebook.com/techwashlaundry',
    youtube: 'https://youtube.com',
    googleBusiness: 'https://maps.google.com',
  },
  workingHours: {
    weekdays: '9:30 AM - 9:30 PM',
    weekends: '9:30 AM - 9:30 PM',
    weeklyHolidays: 'Open 7 Days a Week',
  }
};

export const DEFAULT_STORE_LOCATIONS = [
  {
    id: 'loc-branch-1',
    name: 'Tech Wash Laundry Services (Branch 1)',
    address: 'Beside DreamScape Hotel Ward No 8, Block No 1 , Tolichowki , OU Colony, Shaikpet,Hyderabad,Telangana 500008',
    phone: '+91 63048 45567',
    whatsapp: '+91 63048 45567',
    timings: '9:30 AM - 9:30 PM',
    weeklyHolidays: 'Open 7 Days a Week',
    latitude: 17.4082,
    longitude: 78.4067,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Beside+DreamScape+Hotel+Ward+No+8+Tolichowki+OU+Colony+Shaikpet+Hyderabad',
    isMain: false,
    active: true,
    posTerminalId: 'counter-1',
    posTerminalCode: 'TW-POS-01',
    assignedOperator: 'Cashier #1',
    posPassword: 'techwash1',
    posMachineActive: true,
  },
  {
    id: 'loc-pickup-point',
    name: 'Tech Wash Pick Up Point',
    address: 'Beside Ambience Courtyard,Hyderabad,Telangana,500089',
    phone: '+91 63048 45567',
    whatsapp: '+91 63048 45567',
    timings: '9:30 AM - 9:30 PM',
    weeklyHolidays: 'Open 7 Days a Week',
    latitude: 17.4069,
    longitude: 78.3842,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Beside+Ambience+Courtyard+Hyderabad+500089',
    isMain: false,
    active: true,
    posTerminalId: 'counter-2',
    posTerminalCode: 'TW-POS-02',
    assignedOperator: 'Cashier #2',
    posPassword: 'techwash2',
    posMachineActive: true,
  },
  {
    id: 'loc-main-branch',
    name: 'Tech Wash Laundry Main Branch',
    address: 'Shaikpet Main Rd,Sri Ram Nagar Colony,Manikonda,Hyderabad,Telangana,500089',
    phone: '+91 63048 45567',
    whatsapp: '+91 63048 45567',
    timings: '9:30 AM - 9:30 PM (All Days)',
    weeklyHolidays: 'Open 7 Days a Week',
    latitude: 17.4005,
    longitude: 78.3895,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Shaikpet+Main+Rd+Sri+Ram+Nagar+Colony+Manikonda+Hyderabad+500089',
    isMain: true,
    active: true,
    posTerminalId: 'counter-3',
    posTerminalCode: 'TW-POS-03',
    assignedOperator: 'Cashier #3',
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
