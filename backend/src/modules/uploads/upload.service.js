import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'krishna_hospital',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

/**
 * Uploads image (file buffer or base64 data URL) to Cloudinary.
 * @param {string} imageStr - Base64 Data URL or file payload to upload.
 * @param {string} folder - Target Cloudinary folder name.
 * @returns {Promise<object>} Upload result object containing secure_url.
 */
export const uploadToCloudinary = async (imageStr, folder = 'krishna_hospital') => {
  if (!imageStr) {
    throw new Error('No image data provided for upload');
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Fallback to image string intact if credentials are placeholders
  if (!apiKey || apiKey.includes('your_cloudinary') || !apiSecret || apiSecret.includes('your_cloudinary')) {
    console.warn('[Cloudinary Service] Cloudinary API credentials not configured in backend/.env; returning local image URL fallback.');
    return {
      secure_url: imageStr,
      public_id: `fallback_${Date.now()}`,
      isFallback: true,
    };
  }

  const options = {
    folder: `krishna_hospital/${folder}`,
    resource_type: 'auto',
  };

  const result = await cloudinary.uploader.upload(imageStr, options);
  return result;
};
