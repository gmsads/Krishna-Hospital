import { Router } from 'express';
import { create, getLabServices, getLabService, update, remove, getNextServiceId } from './lab-service.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();

router.get('/', getLabServices);
router.get('/next-serviceid', getNextServiceId);
router.post('/', protect, authorize('Super Admin', 'Admin', 'Lab Assistant'), create);
router.get('/:id', getLabService);
router.put('/:id', protect, authorize('Super Admin', 'Admin', 'Lab Assistant'), update);
router.delete('/:id', protect, authorize('Super Admin', 'Admin'), remove);

export default router;
