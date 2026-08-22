const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(cloudName && apiKey && apiSecret && !cloudName.includes('YOUR_'));

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  console.log('[Cloudinary] Configured successfully for cloud name:', cloudName);
} else {
  console.log('[Cloudinary] Running in hybrid/fallback mode (local compression active)');
}

/**
 * Uploads a base64 string or buffer to Cloudinary
 * @param {string} fileStr - Base64 data URL or remote URL
 * @param {string} folder - Destination folder (e.g., 'nstp/id_photos', 'nstp/cor_documents')
 * @returns {Promise<{url: string, public_id: string, isCloudinary: boolean}>}
 */
async function uploadMedia(fileStr, folder = 'nstp/uploads') {
  if (!fileStr || typeof fileStr !== 'string') {
    return { url: fileStr, public_id: null, isCloudinary: false };
  }

  // If already a remote HTTPS URL (e.g. from Cloudinary or external CDN), return as-is
  if (fileStr.startsWith('http://') || fileStr.startsWith('https://')) {
    return { url: fileStr, public_id: null, isCloudinary: fileStr.includes('cloudinary') };
  }

  // If Cloudinary credentials are not provided, return the sanitized base64 string safely
  if (!isConfigured) {
    return { url: fileStr, public_id: null, isCloudinary: false };
  }

  try {
    const isPdf = fileStr.startsWith('data:application/pdf');
    const uploadOptions = {
      folder: folder,
      resource_type: isPdf ? 'raw' : 'image',
      overwrite: true,
    };

    if (!isPdf) {
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ];
    }

    const result = await cloudinary.uploader.upload(fileStr, uploadOptions);
    return {
      url: result.secure_url || result.url,
      public_id: result.public_id,
      isCloudinary: true
    };
  } catch (err) {
    console.warn('[Cloudinary] Upload notice (falling back to base64):', err.message);
    return { url: fileStr, public_id: null, isCloudinary: false };
  }
}

module.exports = {
  isConfigured,
  uploadMedia,
  cloudinary
};
