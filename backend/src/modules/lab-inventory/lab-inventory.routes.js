import { Router } from 'express';
import { getItems, create, consume, update, remove } from './lab-inventory.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, getItems);
router.post('/', protect, create);
router.patch('/:id/consume', protect, consume);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

export default router;
