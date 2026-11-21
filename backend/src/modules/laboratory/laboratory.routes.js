import { Router } from 'express';
import { create, getLabOrders, getLabOrder, update, remove, getNextLabNo } from './laboratory.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', getLabOrders);
router.get('/next-labno', getNextLabNo);
router.post('/', protect, create);
router.get('/:id', getLabOrder);
router.put('/:id', protect, update);
router.patch('/:id', protect, update);
router.delete('/:id', protect, remove);

export default router;
