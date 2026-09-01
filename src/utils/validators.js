/**
 * Form and input validators for Tech Wash Admin and Customer flows
 */
import { isValidYouTubeUrl } from './youtube.js';

export const validatePhone = (phone) => {
  if (!phone) return false;
  // Indian 10-digit mobile number pattern (optional +91 / 0 prefix)
  const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validateUrl = (url) => {
  if (!url) return true; // Optional fields can be empty
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const validateRequired = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

export { isValidYouTubeUrl };
