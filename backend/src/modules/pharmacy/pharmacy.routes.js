import { Router } from 'express';
import { create, getSales, getSale, remove, getNextSaleNo } from './pharmacy.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', getSales);
router.get('/next-saleno', getNextSaleNo);
router.post('/', protect, create);
router.get('/:id', getSale);
router.delete('/:id', protect, remove);

export default router;
