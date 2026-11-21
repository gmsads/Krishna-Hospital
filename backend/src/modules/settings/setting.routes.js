import { Router } from 'express';
import { getSettings, updateSettings } from './setting.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', getSettings);
router.put('/', protect, updateSettings);

export default router;
