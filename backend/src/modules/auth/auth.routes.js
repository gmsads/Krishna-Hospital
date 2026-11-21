import { Router } from 'express';
import { register, login, getMe, logout, updateProfile, updatePassword, forgotPassword, resetPassword } from './auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

export default router;
