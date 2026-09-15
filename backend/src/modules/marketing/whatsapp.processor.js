import { WhatsAppAdapter } from './whatsapp.adapter.js';
import { WHATSAPP_CONFIG } from '../../config/whatsapp.config.js';
import { normalizeInbound } from './whatsapp.inbound.js';
import { splitTextForWhatsApp } from './whatsapp.text.js';
import { sendWithRetry } from './whatsapp.retry.js';
import { generateHospitalAIReply } from './whatsapp.ai.js';
import { WhatsAppMessageLog, WhatsAppChatState } from './chat.model.js';
import { OPRecord } from '../op-records/op-record.model.js';

import { WhatsAppFlowProcessor } from './flow.processor.js';

export class WhatsAppWebhookProcessor {
  constructor(adapter = new WhatsAppAdapter()) {
    this.adapter = adapter;
    this.flowProcessor = new WhatsAppFlowProcessor(adapter);
  }

  async handle(payload) {
    if (!payload || !payload.entry) return;

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const contacts = change.value?.contacts || [];

        for (const message of change.value?.messages || []) {
          const senderName = contacts.find((c) => c.wa_id === message.from)?.profile?.name;
          await this.handleMessage(message, senderName);
        }

        for (const status of change.value?.statuses || []) {
          await this.handleStatus(status);
        }
      }
    }
  }

  async handleMessage(message, senderName) {
    const inbound = normalizeInbound(message);
    if (!inbound) return;

    // Send blue tick & typing indicator
    await this.adapter.markMessageAsRead({ messageId: inbound.messageId });

    console.log(`[WhatsApp Inbound] Message from ${senderName || inbound.from} (${inbound.from}): [${inbound.contentType}] "${inbound.text}"`);

    // Resolve patient registered branch from MongoDB
    let patientBranch = 'All';
    try {
      const cleanDigits = String(inbound.from).replace(/\D/g, '').slice(-10);
      const opRec = await OPRecord.findOne({ phone: new RegExp(cleanDigits + '$') }).select('branch');
      if (opRec && opRec.branch) patientBranch = opRec.branch;
    } catch (err) {
      console.warn('[WhatsApp Log] Could not resolve patient branch:', err.message);
    }

    // Log inbound patient message to MongoDB
    try {
      await WhatsAppMessageLog.create({
        phone: inbound.from,
        senderName: senderName || 'Patient',
        direction: 'inbound',
        messageText: inbound.text || `[${inbound.contentType}]`,
        senderType: 'patient',
        messageId: inbound.messageId,
        branch: patientBranch,
      });
    } catch (err) {
      console.warn('[WhatsApp Log Error] Could not save inbound chat log:', err.message);
    }

    // 1. Check Chat Mode (AI vs Human Staff Mode)
    const cleanFrom = String(inbound.from).replace(/\D/g, '').slice(-10);
    const chatState = await WhatsAppChatState.findOne({
      $or: [{ phone: cleanFrom }, { phone: inbound.from }],
    });

    if (chatState && chatState.mode === 'human') {
      console.log(`[WhatsApp Mode] Conversation with ${inbound.from} is in HUMAN mode. Skipping AI auto-reply.`);
      return;
    }

    // 2. Try Visual Flow Execution First
    const flowResult = await this.flowProcessor.processInboundFlow(inbound.from, inbound.text);
    if (flowResult && flowResult.handled) {
      console.log(`[WhatsApp Flow Engine] Message from ${inbound.from} handled by flow node: ${flowResult.nodeType}`);
      return;
    }

    // 3. AI Auto-responder Fallback (Active when mode === 'ai')
    if (inbound.contentType === 'text' && inbound.text) {
      const aiReply = await generateHospitalAIReply(inbound.from, senderName || 'Patient', inbound.text);
      if (aiReply) {
        await this.reply(inbound.from, aiReply, inbound.messageId, 'ai');
      }
    } else if (inbound.contentType === 'unsupported') {
      const defaultReply = 'Thank you for reaching out to Krishna Hospitals. For special attachments, please call our desk directly at +91 80744 99548.';
      await this.reply(inbound.from, defaultReply, inbound.messageId, 'system');
    }
  }

  async reply(to, text, quoteMessageId, senderType = 'ai') {
    let patientBranch = 'All';
    try {
      const cleanDigits = String(to).replace(/\D/g, '').slice(-10);
      const opRec = await OPRecord.findOne({ phone: new RegExp(cleanDigits + '$') }).select('branch');
      if (opRec && opRec.branch) patientBranch = opRec.branch;
    } catch (err) {}

    for (const chunk of splitTextForWhatsApp(text)) {
      const result = await sendWithRetry(this.adapter, {
        phoneNumber: to,
        messageType: 'text',
        textContent: chunk,
        replyToMessageId: quoteMessageId,
      });

      if (result.success) {
        // Log outbound AI or Staff message to MongoDB
        try {
          await WhatsAppMessageLog.create({
            phone: to,
            senderName: senderType === 'ai' ? 'Krishna AI' : 'Staff',
            direction: 'outbound',
            messageText: chunk,
            senderType: senderType,
            messageId: result.messageId || '',
            branch: patientBranch,
          });
        } catch (err) {
          console.warn('[WhatsApp Log Error] Could not save outbound chat log:', err.message);
        }
      } else {
        console.error(`[WhatsApp Reply Error] Reply to ${to} failed: ${result.error} (code ${result.errorCode})`);
        break;
      }
    }
  }

  async handleStatus(status) {
    console.log(`[WhatsApp Status Update] ${status.id} → ${status.status} (recipient: ${status.recipient_id})`);

    if (status.status === 'failed') {
      const windowExpired = status.errors?.some((e) => e.code === 131047);
      if (windowExpired && WHATSAPP_CONFIG.REENGAGEMENT_TEMPLATE) {
        await this.adapter.send({
          phoneNumber: status.recipient_id,
          messageType: 'template',
          templateName: WHATSAPP_CONFIG.REENGAGEMENT_TEMPLATE,
          templateLanguage: 'en_US',
        });
      }
    }
  }
}
