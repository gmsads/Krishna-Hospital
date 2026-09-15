import { ApiResponse } from '../utils/apiResponse.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'User identity not found in request', 401);
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Role '${req.user.role}' is not authorized to access this resource`,
        403
      );
    }

    next();
  };
};
