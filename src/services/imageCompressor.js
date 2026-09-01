/**
 * Tiered Image Compressor & ImgBB Upload Pipeline for Tech Wash
 * Context-aware targets:
 * - thumbnail: <= 150 KB
 * - card: <= 250 KB
 * - gallery: <= 500 KB
 * - hero: <= 800 KB (Preserving HD crispness)
 */
import imageCompression from 'browser-image-compression';

export const COMPRESSION_TARGETS = {
  thumbnail: { maxSizeMB: 0.15, maxWidthOrHeight: 400, label: 'Thumbnail (≤150KB)' },
  card: { maxSizeMB: 0.25, maxWidthOrHeight: 800, label: 'Card / Grid (≤250KB)' },
  gallery: { maxSizeMB: 0.5, maxWidthOrHeight: 1400, label: 'Gallery / Showcase (≤500KB)' },
  hero: { maxSizeMB: 0.8, maxWidthOrHeight: 2000, label: 'Hero Banner (≤800KB)' },
};

/**
 * Compresses an image file in the browser before cloud upload
 * Returns { file, originalSize, compressedSize, savingsPercent, width, height, dataUrl }
 */
export const compressImage = async (file, context = 'gallery') => {
  if (!file) throw new Error('No file provided for compression');

  const originalSize = file.size;
  const targetConfig = COMPRESSION_TARGETS[context] || COMPRESSION_TARGETS.gallery;

  // If already below target size, do not over-compress
  if (originalSize <= targetConfig.maxSizeMB * 1024 * 1024 && file.type.includes('webp')) {
    const dataUrl = await imageCompression.getDataUrlFromFile(file);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savingsPercent: 0,
      format: file.type,
      dataUrl,
    };
  }

  const options = {
    maxSizeMB: targetConfig.maxSizeMB,
    maxWidthOrHeight: targetConfig.maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    const compressedSize = compressedFile.size;
    const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));
    const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      savingsPercent,
      format: 'image/webp',
      dataUrl,
    };
  } catch (error) {
    console.warn("Client-side compression fallback to original:", error);
    const dataUrl = await imageCompression.getDataUrlFromFile(file);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savingsPercent: 0,
      format: file.type,
      dataUrl,
    };
  }
};

/**
 * Uploads compressed image to ImgBB CDN using VITE_IMGBB_API_KEY
 * Stores metadata and returns { url, thumbUrl, deleteUrl, title, size }
 */
export const uploadToImgBB = async (compressedFile, title = '') => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  // If ImgBB API key is not configured, generate a local persistent Blob/DataURL for zero-breakage demo/dev
  if (!apiKey || apiKey.trim() === '') {
    const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
    return {
      url: dataUrl,
      thumbUrl: dataUrl,
      title: title || compressedFile.name,
      size: compressedFile.size,
      isLocalMock: true,
    };
  }

  const formData = new FormData();
  formData.append('image', compressedFile);
  if (title) formData.append('name', title);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'ImgBB upload failed');
  }

  return {
    url: json.data.url,
    displayUrl: json.data.display_url,
    thumbUrl: json.data.thumb?.url || json.data.url,
    mediumUrl: json.data.medium?.url || json.data.url,
    deleteUrl: json.data.delete_url,
    title: json.data.title,
    size: json.data.size,
  };
};
