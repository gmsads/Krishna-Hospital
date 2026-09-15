import { WhatsAppFlow, WhatsAppMetaTemplate } from './flow.model.js';
import { WhatsAppConfig } from './marketing.model.js';
import { WhatsAppAdapter } from './whatsapp.adapter.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

const adapter = new WhatsAppAdapter();

// Default 1-Click Master Hospital Flow Preset
const defaultHospitalMasterFlow = {
  flowTitle: 'Krishna Hospitals Default Master Flow',
  description: 'Interactive WhatsApp flow: Welcome menu -> OPD Timings / Consultation Fees / Doctor List / OpenAI AI / Reception Handover',
  triggerKeywords: ['hi', 'hello', 'opd', 'book', 'start', 'menu', 'krishna'],
  isDefault: true,
  status: 'Active',
  branch: 'All',
  nodes: [
    {
      id: 'node-1',
      type: 'trigger',
      position: { x: 50, y: 150 },
      data: {
        label: '🚀 Start Trigger',
        keywords: ['hi', 'hello', 'start', 'opd', 'book', 'menu'],
        description: 'Triggers when a patient sends a greeting or keyword',
      },
    },
    {
      id: 'node-2',
      type: 'interactive_menu',
      position: { x: 320, y: 100 },
      data: {
        label: '📜 Main Hospital Interactive Menu',
        headerText: 'WELCOME TO KRISHNA HOSPITALS 🏥',
        bodyText: 'How can we assist you today? Please reply with a number or option below:',
        buttons: [
          { id: 'btn_opd', title: '1. 🏥 OPD Consultation Timings' },
          { id: 'btn_fees', title: '2. 💰 Consultation Fee Info' },
          { id: 'btn_docs', title: '3. 👨‍⚕️ Available Doctors' },
          { id: 'btn_ai', title: '4. 🤖 Ask AI Health Assistant' },
          { id: 'btn_staff', title: '5. 👨‍💼 Talk to Reception Desk' },
        ],
      },
    },
    {
      id: 'node-3',
      type: 'ai_agent',
      position: { x: 680, y: 220 },
      data: {
        label: '🤖 OpenAI AI Agent (gpt-4o-mini)',
        modelName: 'gpt-4o-mini',
        description: 'Answers dynamic medical, OPD, and doctor inquiry questions 24/7 in English, Telugu, Hindi',
      },
    },
    {
      id: 'node-4',
      type: 'staff_handover',
      position: { x: 680, y: 360 },
      data: {
        label: '👨‍💼 Staff Handover Router',
        text: 'Connecting you live with Krishna Hospitals reception desk staff. A receptionist will reply here shortly.',
        description: 'Transfers thread to live inbox (/inbox)',
      },
    },
  ],
  edges: [
    { id: 'e1-2', source: 'node-1', target: 'node-2' },
    { id: 'e2-3', source: 'node-2', target: 'node-3' },
    { id: 'e2-4', source: 'node-2', target: 'node-4' },
  ],
};

// 1. GET Visual Flows
export const getFlows = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const query = {};
  if (branch && branch !== 'All') {
    const branchKeyword = branch.replace(/^Krishna\s+Hospital\s+/i, '').trim();
    query.$or = [{ branch: new RegExp(branchKeyword, 'i') }, { branch: 'All' }];
  }

  let flows = await WhatsAppFlow.find(query).sort({ isDefault: -1, updatedAt: -1 });

  // Seed default master flow if database is empty
  if (flows.length === 0) {
    const created = await WhatsAppFlow.create(defaultHospitalMasterFlow);
    flows = [created];
  }

  return ApiResponse.success(res, flows, 'WhatsApp visual flows fetched', 200);
});

// 2. POST Save/Update Visual Flow Graph
export const saveFlow = asyncHandler(async (req, res) => {
  const { flowId, flowTitle, description, triggerKeywords, nodes, edges, branch, isDefault } = req.body;

  if (!flowTitle || !nodes || !Array.isArray(nodes)) {
    return ApiResponse.error(res, 'Flow title and nodes array are required', 400);
  }

  let flow;
  if (flowId) {
    flow = await WhatsAppFlow.findById(flowId);
  }

  if (!flow) {
    flow = new WhatsAppFlow();
  }

  flow.flowTitle = flowTitle.trim();
  if (description) flow.description = description.trim();
  if (triggerKeywords && Array.isArray(triggerKeywords)) flow.triggerKeywords = triggerKeywords;
  flow.nodes = nodes;
  flow.edges = edges || [];
  if (branch) flow.branch = branch;
  if (typeof isDefault === 'boolean') {
    flow.isDefault = isDefault;
    if (isDefault) {
      // Deactivate previous default flows
      await WhatsAppFlow.updateMany({ _id: { $ne: flow._id } }, { $set: { isDefault: false } });
    }
  }

  await flow.save();
  return ApiResponse.success(res, flow, `Visual flow "${flow.flowTitle}" saved successfully!`, 200);
});

// 3. POST Set Active Default Flow
export const activateFlow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const flow = await WhatsAppFlow.findById(id);

  if (!flow) {
    return ApiResponse.error(res, 'Flow not found', 404);
  }

  await WhatsAppFlow.updateMany({}, { $set: { isDefault: false, status: 'Draft' } });
  flow.isDefault = true;
  flow.status = 'Active';
  await flow.save();

  return ApiResponse.success(res, flow, `Flow "${flow.flowTitle}" activated as default WhatsApp responder!`, 200);
});

const sanitizeMetaButtonText = (str) => {
  if (!str) return 'Click Here';
  const clean = String(str)
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim();
  return clean.slice(0, 25) || 'Click Here';
};

// 4. DELETE Flow
export const deleteFlow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await WhatsAppFlow.findByIdAndDelete(id);
  return ApiResponse.success(res, null, 'Flow deleted successfully', 200);
});

// 5. POST Create & Submit Meta Template Directly to Meta Graph API for Verification
export const createMetaTemplate = asyncHandler(async (req, res) => {
  const { name, category, language, headerType, headerContent, bodyText, footerText, buttons } = req.body;

  if (!name || !bodyText) {
    return ApiResponse.error(res, 'Template name and body text are required', 400);
  }

  const cleanName = String(name).toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const { accessToken } = await adapter.getDynamicCredentials();
  const dbConfig = await WhatsAppConfig.findOne({ isConfigured: true }).sort({ updatedAt: -1 });
  const wabaId = dbConfig?.wabaId || process.env.WHATSAPP_WABA_ID || '1956272015332745';

  if (!accessToken || !wabaId) {
    return ApiResponse.error(res, 'Meta Cloud API credentials not configured in backend/.env', 400);
  }

  // Construct official Meta Graph API payload
  const bodyComponent = {
    type: 'BODY',
    text: bodyText.trim(),
  };

  // Extract variables like {{1}}, {{2}}, etc. and generate example.body_text sample array required by Meta
  const varMatches = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)];
  if (varMatches.length > 0) {
    const maxIndex = Math.max(...varMatches.map((m) => parseInt(m[1], 10) || 1));
    const samplePresets = [
      'Ananya Sharma',
      'Dr. Vijaywada',
      '15th Sept 2026',
      '10:00 AM',
      'Krishna Hospitals',
      'OPD Clinic',
      'Room 204',
      'General Medicine',
    ];
    const sampleValues = [];
    for (let i = 1; i <= maxIndex; i++) {
      sampleValues.push(samplePresets[(i - 1) % samplePresets.length]);
    }
    bodyComponent.example = {
      body_text: [sampleValues],
    };
  }

  const components = [bodyComponent];

  if (headerType && headerType !== 'NONE' && headerContent) {
    if (headerType === 'TEXT') {
      const headerComp = { type: 'HEADER', format: 'TEXT', text: headerContent.trim() };
      const headerVarMatches = [...headerContent.matchAll(/\{\{(\d+)\}\}/g)];
      if (headerVarMatches.length > 0) {
        headerComp.example = {
          header_text: ['Krishna Hospitals Notice'],
        };
      }
      components.push(headerComp);
    } else if (['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerType)) {
      components.push({ type: 'HEADER', format: headerType });
    }
  }

  if (footerText) {
    components.push({ type: 'FOOTER', text: footerText.trim() });
  }

  if (buttons && Array.isArray(buttons) && buttons.length > 0) {
    const formattedBtns = buttons
      .map((b) => {
        const text = sanitizeMetaButtonText(b.text || b.title || 'Book OPD');
        const bType = (b.type || 'QUICK_REPLY').toUpperCase();
        if (bType === 'PHONE_NUMBER') {
          const rawPhone = String(b.phone_number || b.phoneNumber || '+918074499548').trim();
          const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
          return {
            type: 'PHONE_NUMBER',
            text,
            phone_number: cleanPhone || '+918074499548',
          };
        }
        if (bType === 'URL') {
          const urlStr = String(b.url || 'https://krishnahospital.org').trim();
          const btnObj = {
            type: 'URL',
            text,
            url: urlStr,
          };
          if (urlStr.includes('{{1}}')) {
            btnObj.example = ['https://krishnahospital.org/records/12345'];
          }
          return btnObj;
        }
        return {
          type: 'QUICK_REPLY',
          text,
        };
      })
      .filter((b) => b.text.length > 0);

    if (formattedBtns.length > 0) {
      components.push({ type: 'BUTTONS', buttons: formattedBtns });
    }
  }

  const metaPayload = {
    name: cleanName,
    category: category || 'UTILITY',
    language: language || 'en_US',
    components,
  };

  let metaResponseData = null;
  let status = 'PENDING';

  try {
    const url = `https://graph.facebook.com/v22.0/${wabaId}/message_templates`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaPayload),
    });

    metaResponseData = await resp.json();
    if (resp.ok && metaResponseData.id) {
      status = metaResponseData.status || 'PENDING';
    } else {
      console.warn('[Meta Template Submit Warning]', metaResponseData);
      if (metaResponseData?.error) {
        status = 'REJECTED';
      }
    }
  } catch (err) {
    console.error('[Meta Template API Call Error]', err.message);
  }

  // Record template in MongoDB with live status
  const templateRecord = await WhatsAppMetaTemplate.create({
    name: cleanName,
    category: category || 'UTILITY',
    language: language || 'en_US',
    headerType: headerType || 'NONE',
    headerContent: headerContent || '',
    bodyText: bodyText.trim(),
    footerText: footerText || '',
    buttons: buttons || [],
    status: metaResponseData?.status || status,
    metaTemplateId: metaResponseData?.id || '',
  });

  if (!metaResponseData?.id && metaResponseData?.error) {
    const errMsg = metaResponseData.error.error_user_msg || metaResponseData.error.message || 'Meta rejected template submission';
    return ApiResponse.error(res, `Meta Template Submission Error: ${errMsg}`, 400, {
      template: templateRecord,
      metaResponse: metaResponseData,
    });
  }

  return ApiResponse.success(
    res,
    {
      template: templateRecord,
      metaResponse: metaResponseData,
      status: templateRecord.status,
    },
    `Template "${cleanName}" submitted to Meta for official verification! Status: ${templateRecord.status}`,
    200
  );
});

// 6. GET Fetch Live Sync Meta Approved Templates
export const syncMetaTemplates = asyncHandler(async (req, res) => {
  const { accessToken } = await adapter.getDynamicCredentials();
  const dbConfig = await WhatsAppConfig.findOne({ isConfigured: true }).sort({ updatedAt: -1 });
  const wabaId = dbConfig?.wabaId || process.env.WHATSAPP_WABA_ID || '1956272015332745';

  if (!accessToken || !wabaId) {
    const dbTemplates = await WhatsAppMetaTemplate.find().sort({ updatedAt: -1 });
    return ApiResponse.success(res, dbTemplates, 'Database local templates fetched', 200);
  }

  try {
    const url = `https://graph.facebook.com/v22.0/${wabaId}/message_templates?limit=100`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (resp.ok) {
      const data = await resp.json();
      const metaTemplates = data.data || [];

      // Sync status into MongoDB
      for (const mt of metaTemplates) {
        await WhatsAppMetaTemplate.findOneAndUpdate(
          { name: mt.name },
          {
            $set: {
              status: mt.status,
              category: mt.category,
              language: mt.language,
              metaTemplateId: mt.id,
            },
          },
          { upsert: true, new: true }
        );
      }
    }
  } catch (err) {
    console.warn('[Sync Meta Templates Error]', err.message);
  }

  const allTemplates = await WhatsAppMetaTemplate.find().sort({ updatedAt: -1 });
  return ApiResponse.success(res, allTemplates, 'Synced Meta templates with live verification status', 200);
});
