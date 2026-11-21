import { Router } from 'express';
import { create, getStaffMembers, getStaff, update, remove, getNextEmpId } from './staff.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.get('/', getStaffMembers);
router.get('/next-empid', getNextEmpId);
router.post('/', protect, authorize('Super Admin', 'Admin'), create);
router.get('/:id', getStaff);
router.put('/:id', protect, authorize('Super Admin', 'Admin'), update);
router.delete('/:id', protect, authorize('Super Admin', 'Admin'), remove);

export default router;
