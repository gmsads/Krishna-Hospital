import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
    } catch (error) {
      console.warn('Optional token verification notice:', error.message);
    }
  }

  next();
};
