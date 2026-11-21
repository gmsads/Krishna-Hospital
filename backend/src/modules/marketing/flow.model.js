import mongoose from 'mongoose';

const whatsAppFlowSchema = new mongoose.Schema(
  {
    flowTitle: { type: String, required: true },
    description: { type: String, default: '' },
    triggerKeywords: [{ type: String }],
    nodes: [{ type: mongoose.Schema.Types.Mixed }],
    edges: [{ type: mongoose.Schema.Types.Mixed }],
    isDefault: { type: Boolean, default: false },
    branch: { type: String, default: 'All' },
    status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Active' },
  },
  { timestamps: true }
);

const whatsAppMetaTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], default: 'UTILITY' },
    language: { type: String, default: 'en_US' },
    headerType: { type: String, default: 'NONE' },
    headerContent: { type: String, default: '' },
    bodyText: { type: String, required: true },
    footerText: { type: String, default: '' },
    buttons: [{ type: mongoose.Schema.Types.Mixed }],
    status: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], default: 'PENDING' },
    metaTemplateId: { type: String, default: '' },
    branch: { type: String, default: 'All' },
  },
  { timestamps: true }
);

export const WhatsAppFlow = mongoose.model('WhatsAppFlow', whatsAppFlowSchema);
export const WhatsAppMetaTemplate = mongoose.model('WhatsAppMetaTemplate', whatsAppMetaTemplateSchema);
