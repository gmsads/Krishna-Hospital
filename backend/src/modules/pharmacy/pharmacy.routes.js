import { Router } from 'express';
import { create, getSales, getSale, remove, getNextSaleNo, settleCredit } from './pharmacy.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', getSales);
router.get('/next-saleno', getNextSaleNo);
router.post('/', protect, create);
router.patch('/:id/settle-credit', protect, settleCredit);
router.get('/:id', getSale);
router.delete('/:id', protect, remove);

export default router;
