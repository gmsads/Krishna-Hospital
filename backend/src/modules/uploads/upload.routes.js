import { Router } from 'express';
import { uploadImage } from './upload.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// Endpoint: POST /api/v1/upload
router.post('/', protect, uploadImage);

export default router;
