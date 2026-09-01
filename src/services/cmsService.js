/**
 * Universal CMS Service for Modular Website Entities:
 * - Hero Slides (Requirement #6)
 * - General Banners & Festival Banners (Requirements #24, #25)
 * - Announcements (Requirement #23)
 * - Why Choose Us Benefits (Requirement #19)
 * - Testimonials (Requirement #20)
 * - Photo Gallery (Requirement #21)
 * - Blog Posts (Requirement #22)
 * - FAQs (Requirement #61, #62)
 * - Pricing Master Items (Requirement #17)
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { slugify } from '../utils/formatters.js';

const getStorageKey = (entity) => `techwash_cms_${entity}`;

export const cmsService = {
  /**
   * Generic get collection
   */
  async getItems(entityName, { filterActive = false } = {}) {
    let items = [];

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, entityName));
        if (!snap.empty) {
          items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn(`Firestore read failed for ${entityName}:`, e);
      }
    }

    if (items.length === 0) {
      try {
        items = JSON.parse(localStorage.getItem(getStorageKey(entityName)) || '[]');
      } catch (e) {
        items = [];
      }
    }

    if (filterActive) {
      const now = new Date();
      items = items.filter(item => {
        if (item.active === false) return false;
        if (item.startDate && new Date(item.startDate) > now) return false;
        if (item.endDate && new Date(item.endDate) < now) return false;
        return true;
      });
    }

    return items.sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  /**
   * Generic save / update entity
   */
  async saveItem(entityName, itemData) {
    const id = itemData.id || `${entityName.slice(0, 3)}-${Date.now()}`;
    const payload = {
      ...itemData,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: itemData.createdAt || new Date().toISOString(),
      ...(itemData.title && !itemData.slug ? { slug: slugify(itemData.title) } : {}),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, entityName, id), payload, { merge: true });
      } catch (e) {
        console.warn(`Firestore save failed for ${entityName}:`, e);
      }
    }

    const items = await this.getItems(entityName, { filterActive: false });
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) items[idx] = payload;
    else items.unshift(payload);
    localStorage.setItem(getStorageKey(entityName), JSON.stringify(items));

    return payload;
  },

  /**
   * Generic delete entity
   */
  async deleteItem(entityName, itemId) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, entityName, itemId));
      } catch (e) {
        console.warn(`Firestore delete failed for ${entityName}:`, e);
      }
    }

    const items = (await this.getItems(entityName, { filterActive: false })).filter(i => i.id !== itemId);
    localStorage.setItem(getStorageKey(entityName), JSON.stringify(items));
    return true;
  },

  /**
   * Specific Blog Fetcher by Slug
   */
  async getBlogBySlug(slug) {
    const blogs = await this.getItems('blogs');
    return blogs.find(b => b.slug === slug || b.id === slug) || null;
  }
};
