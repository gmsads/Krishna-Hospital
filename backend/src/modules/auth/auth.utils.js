import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (enteredPassword, hashedPassword) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};

export const generateToken = (userPayload) => {
  return jwt.sign(
    {
      id: userPayload._id || userPayload.id,
      email: userPayload.email,
      full_name: userPayload.full_name,
      role: userPayload.role,
      branch: userPayload.branch,
      branchCode: userPayload.branchCode,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};
