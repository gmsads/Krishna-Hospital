import { Router } from 'express';
import {
  validateWebhook,
  makeReceiverHandler,
  getConfig,
  saveConfig,
  getAudienceStats,
  getTemplates,
  broadcastCampaign,
  getCampaigns,
  getAIConfig,
  saveAIConfig,
  testAIReply,
  getChatHistory,
  getConversations,
  getConversationMessages,
  sendManualReply,
  updateChatMode,
} from './whatsapp.controller.js';

import {
  getFlows,
  saveFlow,
  activateFlow,
  deleteFlow,
  createMetaTemplate,
  syncMetaTemplates,
} from './flow.controller.js';

const router = Router();

// Webhook Endpoints (Meta → ERP)
router.get('/whatsapp/receiver/message', validateWebhook);
router.post('/whatsapp/receiver/message', makeReceiverHandler);

// Admin Config & Campaign Endpoints (ERP → Meta)
router.get('/marketing/config', getConfig);
router.post('/marketing/config', saveConfig);
router.get('/marketing/stats', getAudienceStats);
router.get('/marketing/templates', getTemplates);
router.post('/marketing/broadcast', broadcastCampaign);
router.get('/marketing/campaigns', getCampaigns);

// AI Auto-Responder & Live Inbox Endpoints
router.get('/marketing/ai-config', getAIConfig);
router.post('/marketing/ai-config', saveAIConfig);
router.post('/marketing/ai-test', testAIReply);
router.get('/marketing/chat-history', getChatHistory);
router.get('/marketing/conversations', getConversations);
router.get('/marketing/conversations/:phone', getConversationMessages);
router.post('/marketing/reply-manual', sendManualReply);
router.post('/marketing/conversations/mode', updateChatMode);

// Visual Flow Builder & Meta Template Verification Endpoints
router.get('/marketing/flows', getFlows);
router.post('/marketing/flows', saveFlow);
router.post('/marketing/flows/:id/activate', activateFlow);
router.delete('/marketing/flows/:id', deleteFlow);
router.post('/marketing/templates/create', createMetaTemplate);
router.get('/marketing/templates/sync', syncMetaTemplates);

export default router;
