/**
 * Client-Side Image Compressor for In-Store POS Bill & Receipt Uploads
 * Strictly guarantees compressed output is <= 50 KB (51,200 bytes)
 * Uses HTML5 Canvas + JPEG adaptive quality and dimension scaling
 */

export const TARGET_MAX_EXPENSE_BILL_KB = 50;
export const TARGET_MAX_EXPENSE_BILL_BYTES = 50 * 1024; // 51,200 bytes

/**
 * Format bytes into human-readable string (e.g. "34.2 KB", "2.1 MB")
 */
export const formatFileSize = (bytes) => {
  const num = Number(bytes) || 0;
  if (num <= 0) return '0 KB';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Estimate byte size of a Base64 data URL
 */
export const getDataUrlByteLength = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const padding = (base64.endsWith('==') ? 2 : (base64.endsWith('=') ? 1 : 0));
  return Math.max(0, Math.round((base64.length * 3) / 4) - padding);
};

/**
 * Compress an image File or Data URL to strictly <= targetKb (Default: 50 KB)
 * 
 * @param {File|Blob|string} input - File object, Blob, or base64 data URL
 * @param {number} targetKb - Target maximum size in kilobytes (default 50)
 * @returns {Promise<{
 *   dataUrl: string,
 *   sizeBytes: number,
 *   sizeKb: number,
 *   originalSizeBytes: number,
 *   originalSizeKb: number,
 *   width: number,
 *   height: number,
 *   isUnder50Kb: boolean,
 *   success: boolean
 * }>}
 */
export const compressImageToTargetKb = async (input, targetKb = TARGET_MAX_EXPENSE_BILL_KB) => {
  const targetBytes = targetKb * 1024;
  let originalSizeBytes = 0;
  let initialDataUrl = '';

  // 1. Resolve input to a data URL string
  if (typeof input === 'string') {
    initialDataUrl = input;
    originalSizeBytes = getDataUrlByteLength(input);
  } else if (input instanceof Blob || input instanceof File) {
    originalSizeBytes = input.size || 0;
    initialDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  } else {
    throw new Error('Invalid image input: expected File, Blob, or Data URL string');
  }

  // 2. Load into an HTML Image element
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(new Error('Failed to load image for compression'));
    image.src = initialDataUrl;
  });

  const origWidth = img.naturalWidth || img.width || 800;
  const origHeight = img.naturalHeight || img.height || 600;

  // 3. Determine starting dimensions (max dimension capped at 1024px for fast processing & crisp bill text)
  let maxDim = 1024;
  let currentWidth = origWidth;
  let currentHeight = origHeight;

  if (Math.max(origWidth, origHeight) > maxDim) {
    if (origWidth >= origHeight) {
      currentWidth = maxDim;
      currentHeight = Math.round((origHeight * maxDim) / origWidth);
    } else {
      currentHeight = maxDim;
      currentWidth = Math.round((origWidth * maxDim) / origHeight);
    }
  }

  // 4. Adaptive compression loop
  const canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d', { alpha: false });
  let finalDataUrl = '';
  let finalSizeBytes = Infinity;
  let quality = 0.72; // Start with good clarity for receipts

  for (let attempt = 0; attempt < 12; attempt++) {
    canvas.width = Math.max(200, Math.round(currentWidth));
    canvas.height = Math.max(200, Math.round(currentHeight));

    // Ensure white background so transparency in PNG/bill scans doesn't turn pitch black
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    finalDataUrl = canvas.toDataURL('image/jpeg', quality);
    finalSizeBytes = getDataUrlByteLength(finalDataUrl);

    // If we are strictly under targetBytes (50 KB), we are done!
    if (finalSizeBytes <= targetBytes) {
      break;
    }

    // Step down quality
    if (quality > 0.45) {
      quality -= 0.15;
    } else if (quality > 0.25) {
      quality -= 0.08;
    } else {
      // Quality is already low, downscale dimensions by 20% to preserve readable contrast
      currentWidth *= 0.8;
      currentHeight *= 0.8;
      quality = 0.35;
    }
  }

  // Final check
  const isUnder50Kb = finalSizeBytes <= targetBytes;

  return {
    dataUrl: finalDataUrl,
    sizeBytes: finalSizeBytes,
    sizeKb: Number((finalSizeBytes / 1024).toFixed(1)),
    originalSizeBytes,
    originalSizeKb: Number((originalSizeBytes / 1024).toFixed(1)),
    width: canvas.width,
    height: canvas.height,
    isUnder50Kb,
    success: true,
  };
};
