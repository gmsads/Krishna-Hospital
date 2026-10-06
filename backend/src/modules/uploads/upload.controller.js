import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { uploadToCloudinary } from './upload.service.js';

export const uploadImage = asyncHandler(async (req, res) => {
  const { image, folder } = req.body;

  if (!image) {
    return ApiResponse.error(res, 'Image payload is required for upload', 400);
  }

  const result = await uploadToCloudinary(image, folder || 'general');

  return ApiResponse.success(
    res,
    {
      url: result.secure_url,
      public_id: result.public_id,
      isFallback: !!result.isFallback,
    },
    'Image processed and uploaded successfully',
    200
  );
});
