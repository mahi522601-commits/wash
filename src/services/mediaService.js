/**
 * Central Media Library & Asset Management Service for Tech Wash
 * Tracks uploaded images, compression ratios, dimensions, and usage locations
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { compressImage, uploadToImgBB } from './imageCompressor.js';

const MEDIA_STORAGE_KEY = 'techwash_media_library';

export const mediaService = {
  /**
   * Get all media assets
   */
  async getMediaList({ category = 'all', search = '' } = {}) {
    let list = [];

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'media'));
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Firestore media read error:", e);
      }
    }

    if (list.length === 0) {
      try {
        list = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '[]');
      } catch (e) {
        list = [];
      }
    }

    if (category && category !== 'all') {
      list = list.filter(m => m.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => (m.title && m.title.toLowerCase().includes(q)) || (m.tags && m.tags.includes(q)));
    }

    return list.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  },

  /**
   * Process, compress, upload, and register an image asset
   */
  async uploadAsset(file, { title = '', category = 'general', context = 'gallery', tags = [] } = {}) {
    // 1. Browser-side tiered compression
    const compressionResult = await compressImage(file, context);

    // 2. Upload to ImgBB (or local fallback)
    const uploadResult = await uploadToImgBB(compressionResult.file, title || file.name);

    // 3. Create Media Item Record
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const mediaItem = {
      id: mediaId,
      title: title || file.name,
      url: uploadResult.url,
      thumbUrl: uploadResult.thumbUrl || uploadResult.url,
      deleteUrl: uploadResult.deleteUrl || null,
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      savingsPercent: compressionResult.savingsPercent,
      format: compressionResult.format,
      category,
      context,
      tags: tags || [],
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Admin',
    };

    // 4. Save to Firestore if available
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'media', mediaId), mediaItem);
      } catch (e) {
        console.warn("Firestore media write error:", e);
      }
    }

    // 5. Save to local storage
    const list = await this.getMediaList();
    list.unshift(mediaItem);
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(list));

    return mediaItem;
  },

  /**
   * Delete media asset
   */
  async deleteAsset(mediaId) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'media', mediaId));
      } catch (e) {
        console.warn("Firestore delete media error:", e);
      }
    }

    const list = (await this.getMediaList()).filter(m => m.id !== mediaId);
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(list));
    return true;
  }
};
