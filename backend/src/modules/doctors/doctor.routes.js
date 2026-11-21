import { Router } from 'express';
import { create, getDoctors, getDoctor, update, remove, getNextDocId } from './doctor.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.get('/', getDoctors);
router.get('/next-docid', getNextDocId);
router.post('/', protect, authorize('Super Admin', 'Admin'), create);
router.get('/:id', getDoctor);
router.put('/:id', protect, authorize('Super Admin', 'Admin'), update);
router.delete('/:id', protect, authorize('Super Admin', 'Admin'), remove);

export default router;
