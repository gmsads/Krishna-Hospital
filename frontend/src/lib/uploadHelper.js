/**
 * Uploads an image (File object or base64 data URL string) to Cloudinary via the backend upload API.
 * Returns the hosted Cloudinary HTTPS image URL.
 * Gracefully falls back to local data URL if backend/Cloudinary is unconfigured or offline.
 *
 * @param {File|string} fileOrBase64 - File object or base64 data URL string.
 * @param {string} folder - Target folder name ('branding', 'receipts', 'profiles', etc.).
 * @returns {Promise<string>} The uploaded image URL.
 */
export async function uploadImageToCloudinary(fileOrBase64, folder = 'general') {
  if (!fileOrBase64) return '';

  let base64Payload = '';

  if (typeof fileOrBase64 === 'string') {
    base64Payload = fileOrBase64;
  } else if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
    base64Payload = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    });
  }

  if (!base64Payload) return '';

  try {
    const token = localStorage.getItem('kh_auth_token');
    const response = await fetch('/api/v1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        image: base64Payload,
        folder,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success && data.data?.url) {
      return data.data.url;
    }
  } catch (err) {
    console.warn('[Cloudinary Upload Helper] Backend upload endpoint offline:', err.message);
  }

  return base64Payload;
}
