import { Router } from 'express';
import { create, getBranches, getBranch, update, remove } from './branch.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.get('/', getBranches);
router.post('/', protect, authorize('Super Admin'), create);
router.get('/:id', getBranch);
router.put('/:id', protect, authorize('Super Admin'), update);
router.delete('/:id', protect, authorize('Super Admin'), remove);

export default router;
