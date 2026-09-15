import { ApiResponse } from '../utils/apiResponse.js';

export const notFound = (req, res) => {
  return ApiResponse.error(res, `Route Not Found - ${req.originalUrl}`, 404);
};
