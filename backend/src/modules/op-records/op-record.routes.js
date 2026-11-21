import { Router } from 'express';
import { create, getOPRecords, getOPRecord, update, remove, getNextRegNo } from './op-record.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', getOPRecords);
router.get('/next-regno', getNextRegNo);
router.post('/', protect, create);
router.get('/:id', getOPRecord);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

export default router;
