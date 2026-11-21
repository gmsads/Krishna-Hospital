import { ApiResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, _next) => {
  console.error('[Error Middleware]', err.message);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (err.name === 'CastError' || err.name === 'ValidationError') {
    statusCode = 400;
  }

  return ApiResponse.error(res, err.message || 'Internal Server Error', statusCode);
};
