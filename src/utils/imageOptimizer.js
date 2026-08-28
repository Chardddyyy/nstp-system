/**
 * Image Optimization Utilities for Low-Bandwidth / Slow Mobile Connections
 * Compresses images client-side before sending over network,
 * reducing payload size by up to 90% while preserving crystal-clear sharpness.
 */

// Memory Cache for instant re-renders of fetched avatar/photo URLs
const imageMemoryCache = new Map();

/**
 * Compresses an image file (File or Blob or Data URL) into an optimized lightweight JPEG/WebP
 * @param {File|Blob|string} fileOrDataUrl
 * @param {Object} options { maxWidth, maxHeight, quality, mimeType }
 * @returns {Promise<string>} Optimized Base64 Data URL
 */
export async function optimizeImage(fileOrDataUrl, options = {}) {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.80,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve) => {
    // If input is File or Blob, read as data URL first
    if (typeof fileOrDataUrl !== 'string') {
      const reader = new FileReader();
      reader.onload = (e) => {
        processImageSrc(e.target.result, maxWidth, maxHeight, quality, mimeType, resolve);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      processImageSrc(fileOrDataUrl, maxWidth, maxHeight, quality, mimeType, resolve);
    }
  });
}

function processImageSrc(src, maxWidth, maxHeight, quality, mimeType, resolve) {
  if (!src) return resolve(null);
  
  // If not a data URL or image string (e.g. PDF), return original
  if (typeof src === 'string' && src.startsWith('data:application/pdf')) {
    return resolve(src);
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    let { width, height } = img;

    // Calculate aspect-ratio preserved dimensions
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);
      const ctx = canvas.getContext('2d', { alpha: false });
      
      // Fill clean white background for transparency conversion
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // High-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const optimized = canvas.toDataURL(mimeType, quality);
      resolve(optimized);
    } catch (_) {
      // Fallback to original src if canvas tainted or fails
      resolve(src);
    }
  };

  img.onerror = () => {
    resolve(src);
  };

  img.src = src;
}

/**
 * Preload and cache an image into browser memory cache
 * @param {string} url 
 */
export function preloadImage(url) {
  if (!url || typeof url !== 'string') return;
  if (imageMemoryCache.has(url)) return;

  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  img.onload = () => {
    imageMemoryCache.set(url, true);
  };
}
