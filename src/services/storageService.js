/**
 * Tech Wash Media & Storage Service
 * Handles uploading local image files to Firebase Storage with automatic Canvas compression and Base64 fallback
 */
import { storage, isFirebaseConfigured } from './firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Compresses an image file to a reasonable web size (< 1200px, 85% quality)
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) => {
  return new Promise((resolve) => {
    // If SVG or GIF, don't compress
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a File or Blob to a Base64 data URL
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a Base64 data URL to a Blob
 */
const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const storageService = {
  /**
   * Upload an image file from local device to Firebase Storage or return compressed Base64
   */
  async uploadServiceImage(file, serviceSlug = 'service') {
    if (!file) throw new Error('No file provided');

    // 1. Compress image to lightweight WebP format (<150KB)
    const compressedDataUrl = await compressImage(file, 1200, 1200, 0.85);

    // 2. Try uploading to Firebase Storage if configured
    if (isFirebaseConfigured && storage) {
      try {
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `services/${serviceSlug}_${timestamp}_${cleanName}`;
        const storageRef = ref(storage, storagePath);

        const blob = dataURLtoBlob(compressedDataUrl);
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: 'image/webp',
          customMetadata: {
            serviceSlug,
            uploadedAt: new Date().toISOString()
          }
        });

        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
      } catch (err) {
        console.warn('Firebase Storage upload failed, using compressed local Base64 fallback:', err);
      }
    }

    // 3. Return compressed Base64 data URL (works 100% in Firestore and localStorage)
    return compressedDataUrl;
  }
};
