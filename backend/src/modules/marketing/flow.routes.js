import { Router } from 'express';
import {
  getFlows,
  saveFlow,
  activateFlow,
  deleteFlow,
  createMetaTemplate,
  syncMetaTemplates,
} from './flow.controller.js';

const router = Router();

router.get('/flows', getFlows);
router.post('/flows', saveFlow);
router.post('/flows/:id/activate', activateFlow);
router.delete('/flows/:id', deleteFlow);

router.post('/templates/create', createMetaTemplate);
router.get('/templates/sync', syncMetaTemplates);

export default router;
