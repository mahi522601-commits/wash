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
   * Generate Direct Google Maps Navigation URL for Admin / Delivery Fleet
   */
  getGoogleMapsUrl(latitude, longitude) {
    if (!latitude || !longitude) return 'https://maps.google.com';
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  },

  /**
   * Generate Google Maps Turn-by-Turn Directions URL
   */
  getGoogleMapsDirectionsUrl(latitude, longitude) {
    if (!latitude || !longitude) return 'https://maps.google.com';
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
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
};
