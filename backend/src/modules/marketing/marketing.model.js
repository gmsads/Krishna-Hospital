import mongoose from 'mongoose';

const whatsAppConfigSchema = new mongoose.Schema(
  {
    phoneNumberId: { type: String, default: '' },
    accessToken: { type: String, default: '' },
    appSecret: { type: String, default: '' },
    verifyToken: { type: String, default: 'krishna_hospital_whatsapp_verify_token_2026' },
    defaultTemplate: { type: String, default: 'hello_world' },
    reengagementTemplate: { type: String, default: '' },
    wabaId: { type: String, default: '' },
    isConfigured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const whatsAppCampaignSchema = new mongoose.Schema(
  {
    campaignTitle: { type: String, required: true },
    audience: { type: String, required: true },
    templateName: { type: String, required: true },
    templateLanguage: { type: String, default: 'en_US' },
    messageBody: { type: String, default: '' },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: { type: String, enum: ['Sending', 'Completed', 'Failed'], default: 'Completed' },
    sentBy: { type: String, default: 'Admin' },
    branch: { type: String, default: 'All' },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const WhatsAppConfig = mongoose.model('WhatsAppConfig', whatsAppConfigSchema);
export const WhatsAppCampaign = mongoose.model('WhatsAppCampaign', whatsAppCampaignSchema);
