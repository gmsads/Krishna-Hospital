import mongoose from 'mongoose';

const whatsAppMessageLogSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    senderName: { type: String, default: 'Patient' },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    messageText: { type: String, default: '' },
    senderType: { type: String, enum: ['patient', 'ai', 'staff', 'system'], default: 'patient' },
    messageId: { type: String, default: '' },
    branch: { type: String, default: 'All' },
    status: { type: String, default: 'delivered' },
  },
  { timestamps: true }
);

const whatsAppAIConfigSchema = new mongoose.Schema(
  {
    openaiApiKey: { type: String, default: '' },
    isAiEnabled: { type: Boolean, default: true },
    modelName: { type: String, default: 'gpt-4o-mini' },
    systemPrompt: {
      type: String,
      default:
        'You are Krishna Hospitals official AI Health & Service Assistant. Respond politely, concisely, and accurately to patient inquiries about doctors, OPD timings, consultation fees, and hospital branch locations. Reply in the same language as the patient (English, Telugu, Hindi).',
    },
  },
  { timestamps: true }
);

const whatsAppChatStateSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    mode: { type: String, enum: ['ai', 'human'], default: 'ai' },
    assignedStaff: { type: String, default: '' },
    branch: { type: String, default: 'All' },
  },
  { timestamps: true }
);

export const WhatsAppMessageLog = mongoose.model('WhatsAppMessageLog', whatsAppMessageLogSchema);
export const WhatsAppAIConfig = mongoose.model('WhatsAppAIConfig', whatsAppAIConfigSchema);
export const WhatsAppChatState = mongoose.model('WhatsAppChatState', whatsAppChatStateSchema);
