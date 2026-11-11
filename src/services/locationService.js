/**
 * Advanced Location & Geolocation Service for Tech Wash
 * Features:
 * 1. Browser Geolocation with accuracy, timeout & error classification
 * 2. Reverse Geocoding via OpenStreetMap Nominatim with robust fallback parser
 * 3. Place Search & Address Autocomplete suggestions
 * 4. Configurable Service Area & Distance Radius Validator
 * 5. Google Maps URL generator for Admin navigation
 */
import { settingsService } from './settingsService.js';

// OpenStreetMap Nominatim Endpoint
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Tech Wash Laundry Services (Branch 1) Reference Coordinates
// Google Maps: https://www.google.com/maps/place/Tech+Wash+Laundry+Services+(Branch+1)/@17.4061642,78.389446
export const BRANCH_1_COORDS = {
  latitude: 17.4061642,
  longitude: 78.389446,
  name: 'Tech Wash Laundry Services (Branch 1)',
  address: 'Beside Dreamscape Hotel, Tolichowki, OU Colony, Shaikpet, Hyderabad, Telangana 500008',
  googleMapsUrl: 'https://www.google.com/maps/place/Tech+Wash+Laundry+Services+(Branch+1)/@17.4061642,78.389446,15z/data=!4m6!3m5!1s0x3bcb976df9291123:0xcc1f32c0a7234c3c!8m2!3d17.4061642!4d78.389446!16s%2Fg%2F11yny8bl47',
};

export const DISTANCE_DELIVERY_RULES = {
  longDistanceThresholdKm: 15,
  longDistanceFee: 49,
  withinDistanceFee: 0, // Free doorstep delivery within 15 km
};

/**
 * Calculates great-circle distance (in kilometers) between two coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth radius in kilometers
  const dLat = (numLat2 - numLat1) * (Math.PI / 180);
  const dLon = (numLon2 - numLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(numLat1 * (Math.PI / 180)) *
      Math.cos(numLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Calculate distance in km from Tech Wash Branch 1 to a customer coordinate
 */
export function getDistanceFromBranch1(customerLat, customerLon) {
  return calculateDistanceKm(
    BRANCH_1_COORDS.latitude,
    BRANCH_1_COORDS.longitude,
    customerLat,
    customerLon
  );
}

/**
 * Computes doorstep delivery fee based on customer distance from Branch 1:
 * - If distance is 15 km or more (>= 15 km): Rs. 49 only
 * - If distance is under 15 km (< 15 km): FREE (Rs. 0)
 */
export function calculateDeliveryFee({ latitude, longitude, distanceKm = null, itemsSubtotal = 0 } = {}) {
  let dist = distanceKm;
  if (dist === null && latitude != null && longitude != null) {
    dist = getDistanceFromBranch1(latitude, longitude);
  }

  if (dist !== null) {
    if (dist >= DISTANCE_DELIVERY_RULES.longDistanceThresholdKm) {
      return {
        deliveryFee: DISTANCE_DELIVERY_RULES.longDistanceFee,
        distanceKm: dist,
        isLongDistance: true,
        thresholdKm: DISTANCE_DELIVERY_RULES.longDistanceThresholdKm,
        ruleDescription: `Distance from Branch 1 is ${dist} km (≥ 15 km). Long-distance delivery fee: ₹49 only.`,
      };
    } else {
      return {
        deliveryFee: DISTANCE_DELIVERY_RULES.withinDistanceFee,
        distanceKm: dist,
        isLongDistance: false,
        thresholdKm: DISTANCE_DELIVERY_RULES.longDistanceThresholdKm,
        ruleDescription: `Distance from Branch 1 is ${dist} km (< 15 km). Free doorstep pickup & delivery!`,
      };
    }
  }

  // Fallback if coordinates are not available:
  const fallbackFee = (itemsSubtotal >= 499 || itemsSubtotal === 0) ? 0 : 49;
  return {
    deliveryFee: fallbackFee,
    distanceKm: null,
    isLongDistance: false,
    thresholdKm: DISTANCE_DELIVERY_RULES.longDistanceThresholdKm,
    ruleDescription: fallbackFee === 0 ? 'Free doorstep delivery' : 'Doorstep delivery: ₹49',
  };
}

export const locationService = {
  /**
   * Request live device coordinates with high accuracy
   */
  async getCurrentPosition(options = {}) {
    if (!navigator.geolocation) {
      throw new Error('UNSUPPORTED: Geolocation is not supported by your browser.');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
      ...options,
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy || 0),
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          let code = 'UNKNOWN_ERROR';
          let message = 'Unable to detect your location. You can enter address manually.';

          if (error.code === error.PERMISSION_DENIED) {
            code = 'PERMISSION_DENIED';
            message = 'Location access was denied. You can enter your pickup address manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            code = 'POSITION_UNAVAILABLE';
            message = 'Current location is unavailable right now. Please enter address manually.';
          } else if (error.code === error.TIMEOUT) {
            code = 'TIMEOUT';
            message = 'Location request timed out. Please try again or enter manually.';
          }

          const err = new Error(message);
          err.code = code;
          reject(err);
        },
        defaultOptions
      );
    });
  },

  /**
   * Reverse Geocode (Latitude, Longitude -> Address Object)
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'TechWashLaundry/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status ${response.status}`);
      }

      const data = await response.json();
      const addr = data.address || {};

      // Parse granular components
      const houseNumber = addr.house_number || addr.building || '';
      const street = addr.road || addr.street || addr.footway || addr.residential || '';
      const area = addr.suburb || addr.neighbourhood || addr.subdivision || addr.quarter || addr.commercial || '';
      const locality = addr.locality || addr.subdistrict || area || '';
      const city = addr.city || addr.town || addr.village || addr.municipality || 'Hyderabad';
      const district = addr.state_district || addr.county || '';
      const state = addr.state || 'Telangana';
      const postalCode = addr.postcode || '';
      const country = addr.country || 'India';

      // Build clean readable address string
      const formattedParts = [
        houseNumber,
        street,
        area,
        city,
        state,
        postalCode ? `- ${postalCode}` : '',
      ].filter(Boolean);

      const formattedAddress = data.display_name || formattedParts.join(', ');

      return {
        formattedAddress,
        houseNumber,
        street,
        area,
        locality,
        city,
        district,
        state,
        postalCode,
        country,
        rawDisplayName: data.display_name,
        latitude,
        longitude,
      };
    } catch (e) {
      console.warn("Reverse geocode network error, fallback to coordinate snapshot:", e);
      return {
        formattedAddress: `Location at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        houseNumber: '',
        street: '',
        area: '',
        locality: '',
        city: 'Hyderabad',
        district: '',
        state: 'Telangana',
        postalCode: '',
        country: 'India',
        latitude,
        longitude,
      };
    }
  },

  /**
   * Search Places & Address Suggestions
   */
  async searchAddresses(queryText) {
    if (!queryText || queryText.trim().length < 2) return [];

    try {
      const url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(queryText)}&countrycodes=in&addressdetails=1&limit=6`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'TechWashLaundry/1.0',
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.map((item) => {
        const a = item.address || {};
        return {
          id: item.place_id,
          displayName: item.display_name,
          title: item.name || a.road || a.suburb || item.display_name.split(',')[0],
          subtitle: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city: a.city || a.town || a.village || '',
          state: a.state || '',
          postalCode: a.postcode || '',
          area: a.suburb || a.neighbourhood || '',
          street: a.road || '',
        };
      });
    } catch (e) {
      console.warn("Address search error:", e);
      return [];
    }
  },

  /**
   * Validate if address or coordinates are inside Tech Wash service area
   */
  async checkServiceArea({ latitude, longitude, city, postalCode } = {}) {
    try {
      const settings = await settingsService.getSettings();
      const serviceAreaConfig = settings?.serviceArea || {
        enabled: true,
        openToAll: true,
        allowedCities: ['Hyderabad', 'Secunderabad', 'Tirupati', 'Bengaluru'],
        allowedPincodes: [],
        maxRadiusKm: 35,
      };

      if (!serviceAreaConfig.enabled || serviceAreaConfig.openToAll) {
        return { isAvailable: true, message: 'Pickup available at this location' };
      }

      // Check City matching
      if (city && serviceAreaConfig.allowedCities?.length > 0) {
        const cityMatch = serviceAreaConfig.allowedCities.some(
          (c) => c.toLowerCase() === city.toLowerCase()
        );
        if (!cityMatch) {
          return {
            isAvailable: false,
            message: `Currently Tech Wash doorstep pickup is available in ${serviceAreaConfig.allowedCities.join(', ')}.`,
          };
        }
      }

      // Check PIN Code matching
      if (postalCode && serviceAreaConfig.allowedPincodes?.length > 0) {
        const pinMatch = serviceAreaConfig.allowedPincodes.includes(postalCode.trim());
        if (!pinMatch) {
          return {
            isAvailable: false,
            message: `Doorstep pickup is currently expanding to PIN code ${postalCode}.`,
          };
        }
      }

      return { isAvailable: true, message: 'Pickup available' };
    } catch (e) {
      return { isAvailable: true, message: 'Pickup available' };
    }
  },

  /**
   * Generate Direct Google Maps Navigation / Search URL
   */
  getGoogleMapsUrl(latitude, longitude, address = '') {
    if (latitude && longitude && Number(latitude) !== 0 && Number(longitude) !== 0) {
      return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }
    if (address && typeof address === 'string' && address.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
    }
    return 'https://www.google.com/maps';
  },

  /**
   * Generate Google Maps Turn-by-Turn Directions URL
   */
  getGoogleMapsDirectionsUrl(latitude, longitude, address = '') {
    if (latitude && longitude && Number(latitude) !== 0 && Number(longitude) !== 0) {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }
    if (address && typeof address === 'string' && address.trim()) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
    }
    return 'https://www.google.com/maps';
  },

  /**
   * Saved Addresses Management (Profile / localStorage)
   */
  getSavedAddresses() {
    try {
      return JSON.parse(localStorage.getItem('techwash_saved_addresses') || '[]');
    } catch (e) {
      return [];
    }
  },

  saveAddress(addrObj) {
    const list = this.getSavedAddresses();
    const id = addrObj.id || `addr-${Date.now()}`;
    const entry = { ...addrObj, id, savedAt: new Date().toISOString() };
    const existingIdx = list.findIndex((a) => a.id === id);
    if (existingIdx >= 0) list[existingIdx] = entry;
    else list.push(entry);
    localStorage.setItem('techwash_saved_addresses', JSON.stringify(list));
    return entry;
  },

  deleteSavedAddress(id) {
    const list = this.getSavedAddresses().filter((a) => a.id !== id);
    localStorage.setItem('techwash_saved_addresses', JSON.stringify(list));
    return list;
  },

  // Distance & Delivery Calculation Helpers
  BRANCH_1_COORDS,
  DISTANCE_DELIVERY_RULES,
  calculateDistanceKm,
  getDistanceFromBranch1,
  calculateDeliveryFee,

  /**
   * Geocode a text address to coordinates (cached or Nominatim lookup)
   */
  async geocodeAddress(addressText) {
    if (!addressText || typeof addressText !== 'string' || addressText.trim().length < 3) return null;
    try {
      const results = await this.searchAddresses(addressText);
      if (results && results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          displayName: results[0].displayName,
        };
      }
    } catch (e) {
      console.warn("Geocode error:", e);
    }
    return null;
  },
};
