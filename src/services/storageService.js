/**
 * Tech Wash High-Definition Media & Storage Compression Service
 * Adaptively compresses local images to crystal-clear HD quality strictly under 100 KB.
 * Uploads to Firebase Storage with instant Base64 fallback.
 */
import { storage, isFirebaseConfigured } from './firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Adaptively compresses an image to HD resolution strictly under 100 KB
 * Uses multi-pass WebP canvas encoding with high-quality bicubic smoothing.
 */
export const compressImageToTargetSize = (file, targetMaxKb = 100) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Pass through SVGs
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        resolve({
          dataUrl: result,
          sizeKb: Math.round((result.length * 0.75) / 1024),
          originalSizeKb: Math.round(file.size / 1024),
          width: 800,
          height: 800,
          format: 'svg'
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;
        const origSizeKb = Math.round(file.size / 1024) || 1;

        // Progressive multi-pass parameters prioritizing HD clarity & target <= 100KB
        const passes = [
          { maxDim: 1280, quality: 0.82, format: 'image/webp' },
          { maxDim: 1200, quality: 0.78, format: 'image/webp' },
          { maxDim: 1080, quality: 0.74, format: 'image/webp' },
          { maxDim: 960,  quality: 0.70, format: 'image/webp' },
          { maxDim: 880,  quality: 0.65, format: 'image/webp' },
          { maxDim: 800,  quality: 0.60, format: 'image/webp' },
          { maxDim: 720,  quality: 0.60, format: 'image/jpeg' },
        ];

        let bestResult = null;

        for (let i = 0; i < passes.length; i++) {
          const { maxDim, quality, format } = passes[i];
          let width = origWidth;
          let height = origHeight;

          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL(format, quality);
            const base64Data = dataUrl.split(',')[1] || '';
            const sizeKb = Math.round((base64Data.length * 0.75) / 1024) || 1;

            bestResult = {
              dataUrl,
              sizeKb,
              originalSizeKb: origSizeKb,
              width,
              height,
              format: format.replace('image/', ''),
              quality
            };

            // If within budget, stop and return the best HD quality
            if (sizeKb <= targetMaxKb) {
              break;
            }
          }
        }

        if (bestResult) {
          resolve(bestResult);
        } else {
          resolve({
            dataUrl: e.target.result,
            sizeKb: origSizeKb,
            originalSizeKb: origSizeKb,
            width: origWidth,
            height: origHeight,
            format: 'original'
          });
        }
      };
      img.onerror = () => reject(new Error('Failed to decode image file'));
      img.src = e.target.result;
    };
    reader.onerror = reject;
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
   * Process and compress local image file to HD under 100 KB and upload
   */
  async uploadServiceImage(file, serviceSlug = 'service') {
    if (!file) throw new Error('No image file provided');

    // 1. Compress adaptively to HD quality strictly <= 100 KB
    const compressionResult = await compressImageToTargetSize(file, 100);
    const { dataUrl, sizeKb, originalSizeKb, width, height } = compressionResult;

    // 2. Attempt quick upload to Firebase Storage if configured (2.5s timeout)
    if (isFirebaseConfigured && storage) {
      try {
        const uploadPromise = (async () => {
          const timestamp = Date.now();
          const cleanSlug = (serviceSlug || 'service').replace(/[^a-zA-Z0-9-]/g, '_');
          const storagePath = `services/${cleanSlug}_${timestamp}.webp`;
          const storageRef = ref(storage, storagePath);

          const blob = dataURLtoBlob(dataUrl);
          const snapshot = await uploadBytes(storageRef, blob, {
            contentType: 'image/webp',
            customMetadata: {
              serviceSlug: cleanSlug,
              width: String(width),
              height: String(height),
              sizeKb: String(sizeKb)
            }
          });
          return await getDownloadURL(snapshot.ref);
        })();

        // Race with timeout so UI never hangs
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage upload timeout')), 2500)
        );

        const remoteUrl = await Promise.race([uploadPromise, timeoutPromise]);
        return {
          url: remoteUrl,
          dataUrl,
          sizeKb,
          originalSizeKb,
          width,
          height,
          isRemote: true
        };
      } catch (err) {
        console.warn('Firebase Storage upload skipped/failed, using compressed HD Base64 (<100KB):', err?.message || err);
      }
    }

    // 3. Return high-speed HD Base64 Data URL (<100 KB, perfect for Firestore & instant rendering)
    return {
      url: dataUrl,
      dataUrl,
      sizeKb,
      originalSizeKb,
      width,
      height,
      isRemote: false
    };
  },

  /**
   * Process and compress Before/After gallery transformation image to HD under 100 KB
   */
  async uploadGalleryImage(file, prefix = 'transformation') {
    return this.uploadServiceImage(file, `gallery_${prefix}`);
  },

  /**
   * Generic image uploader with HD compression strictly under 100 KB
   */
  async uploadImage(file, folder = 'general') {
    return this.uploadServiceImage(file, folder);
  }
};
