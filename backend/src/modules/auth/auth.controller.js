import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { validateRegisterInput, validateLoginInput } from './auth.validation.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateRegisterInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const result = await authService.registerUser(req.body);
  return ApiResponse.success(res, result, 'User registered successfully', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { isValid, errors } = validateLoginInput(req.body);
  if (!isValid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const result = await authService.loginUser(req.body.email, req.body.password);
  return ApiResponse.success(res, result, 'Login successful', 200);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  return ApiResponse.success(res, { user }, 'Current user profile fetched successfully', 200);
});

export const logout = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, null, 'Logged out successfully', 200);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateUserProfile(req.user.id, req.body);
  return ApiResponse.success(res, { user: updatedUser }, 'Profile updated successfully', 200);
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return ApiResponse.error(res, 'Current password and new password are required', 400);
  }
  if (newPassword.length < 6) {
    return ApiResponse.error(res, 'New password must be at least 6 characters long', 400);
  }

  const result = await authService.updateUserPassword(req.user.id, currentPassword, newPassword);
  return ApiResponse.success(res, result, 'Password changed successfully', 200);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { emailOrPhone, email } = req.body;
  const targetVal = emailOrPhone || email;
  if (!targetVal) {
    return ApiResponse.error(res, 'Registered email address or phone number is required', 400);
  }

  const result = await authService.requestForgotPasswordOtp(targetVal);
  return ApiResponse.success(res, result, 'Security OTP verification code generated successfully', 200);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { emailOrPhone, email, otp, otpCode, newPassword } = req.body;
  const targetVal = emailOrPhone || email;
  const targetOtp = otp || otpCode;

  if (!targetVal || !targetOtp || !newPassword) {
    return ApiResponse.error(res, 'Email/phone, OTP verification code, and new password are required', 400);
  }

  const result = await authService.resetPasswordWithOtp(targetVal, targetOtp, newPassword);
  return ApiResponse.success(res, result, 'Password reset successfully', 200);
});
