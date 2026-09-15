import crypto from 'crypto';
import { WHATSAPP_CONFIG } from '../../config/whatsapp.config.js';
import { WhatsAppAdapter } from './whatsapp.adapter.js';
import { WhatsAppWebhookProcessor } from './whatsapp.processor.js';
import { MongoDedupStore } from './whatsapp.dedup.js';
import { WhatsAppConfig, WhatsAppCampaign } from './marketing.model.js';
import { WhatsAppMetaTemplate } from './flow.model.js';
import { WhatsAppAIConfig, WhatsAppMessageLog, WhatsAppChatState } from './chat.model.js';
import { generateHospitalAIReply } from './whatsapp.ai.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { OPRecord } from '../op-records/op-record.model.js';

const dedupStore = new MongoDedupStore();
const adapter = new WhatsAppAdapter();
const processor = new WhatsAppWebhookProcessor(adapter);

const constantTimeEquals = (left, right) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const escapeHtml = (value) =>
  String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const verifyHmacSha256Signature = (rawPayload, signatureHeader, secret) => {
  if (!secret || !signatureHeader) return false;
  const sig = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!sig || !/^sha256=[0-9a-f]{64}$/.test(sig)) return false;

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawPayload).digest('hex')}`;
  return constantTimeEquals(sig, expected);
};

// 1. GET Webhook Verification Handshake
export const validateWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];
  const provided = Array.isArray(token) ? token[0] : token;

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || WHATSAPP_CONFIG.VERIFY_TOKEN;
  const valid = typeof provided === 'string' && constantTimeEquals(provided, expectedToken);

  if (mode === 'subscribe' && valid) {
    res.type('text/plain').status(200).send(escapeHtml(challenge));
  } else {
    res.status(403).end();
  }
};

// 2. POST Webhook Message Receiver
export const makeReceiverHandler = async (req, res) => {
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const appSecret = process.env.WHATSAPP_APP_SECRET || WHATSAPP_CONFIG.APP_SECRET;

  if (appSecret) {
    const ok = verifyHmacSha256Signature(rawBody, req.headers['x-hub-signature-256'], appSecret);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid Meta WhatsApp webhook signature' });
    }
  }

  const payload = req.body;
  const messageIds = (payload.entry || []).flatMap((e) =>
    (e.changes || []).flatMap((c) => (c.value?.messages || []).map((m) => m.id))
  );

  if (messageIds.length > 0) {
    const results = await Promise.all(messageIds.map((id) => dedupStore.markProcessed(id)));
    if (!results.some(Boolean)) {
      return res.status(200).end(); // All messages were already handled
    }
  }

  res.status(200).end(); // Immediate ack to Meta

  processor.handle(payload).catch((err) => {
    console.error('[WhatsApp Processor] Unhandled error:', err.message);
  });
};

// 3. Get Credentials Configuration
export const getConfig = asyncHandler(async (req, res) => {
  let dbConfig = await WhatsAppConfig.findOne({ isConfigured: true }).sort({ updatedAt: -1 });

  const envToken = process.env.WHATSAPP_ACCESS_TOKEN || WHATSAPP_CONFIG.ACCESS_TOKEN;
  const envPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || WHATSAPP_CONFIG.PHONE_NUMBER_ID;

  const token = dbConfig?.accessToken || envToken;
  const phoneId = dbConfig?.phoneNumberId || envPhoneId;

  const isConfigured = Boolean(token && phoneId);
  const source = dbConfig?.accessToken ? 'DATABASE' : (envToken ? 'ENVIRONMENT (.env)' : 'NONE');

  return ApiResponse.success(
    res,
    {
      phoneNumberId: phoneId ? `${phoneId.slice(0, 4)}...${phoneId.slice(-4)}` : '',
      rawPhoneNumberId: dbConfig?.phoneNumberId || envPhoneId || '',
      accessToken: token ? `${token.slice(0, 8)}...` : '',
      appSecret: dbConfig?.appSecret ? '••••••••' : (process.env.WHATSAPP_APP_SECRET ? '••••••••' : ''),
      defaultTemplate: dbConfig?.defaultTemplate || WHATSAPP_CONFIG.DEFAULT_TEMPLATE,
      isConfigured,
      source,
    },
    'WhatsApp configuration fetched',
    200
  );
});

// 4. Save/Update Credentials Configuration
export const saveConfig = asyncHandler(async (req, res) => {
  const { phoneNumberId, accessToken, appSecret, defaultTemplate } = req.body;

  let dbConfig = await WhatsAppConfig.findOne({ isConfigured: true });
  if (!dbConfig) {
    dbConfig = new WhatsAppConfig();
  }

  if (phoneNumberId && !phoneNumberId.includes('...')) dbConfig.phoneNumberId = phoneNumberId.trim();
  if (accessToken && !accessToken.includes('...')) dbConfig.accessToken = accessToken.trim();
  if (appSecret && appSecret !== '••••••••') dbConfig.appSecret = appSecret.trim();
  if (defaultTemplate) dbConfig.defaultTemplate = defaultTemplate.trim();
  dbConfig.isConfigured = Boolean(dbConfig.phoneNumberId && dbConfig.accessToken);

  await dbConfig.save();

  return ApiResponse.success(res, { isConfigured: dbConfig.isConfigured }, 'WhatsApp Meta Cloud API credentials saved successfully', 200);
});

// 5. Get Real Database Audience Statistics
export const getAudienceStats = asyncHandler(async (req, res) => {
  const { branch } = req.query;

  const query = {};
  if (branch && branch !== 'All') {
    const branchKeyword = branch.replace(/^Krishna\s+Hospital\s+/i, '').trim();
    const branchRegex = new RegExp(branchKeyword, 'i');
    query.$or = [
      { branch: branchRegex },
      { branchCode: branchRegex },
    ];
  }

  const records = await OPRecord.find(query).select('patientName patient phone age createdAt');
  const validRecords = records.filter((r) => r.phone && adapter.validatePhoneNumber(r.phone));

  const parseAge = (ageStr) => {
    if (!ageStr) return 0;
    const num = parseInt(String(ageStr).replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const stats = {
    all: validRecords.length,
    recent: validRecords.filter((r) => r.createdAt && new Date(r.createdAt) >= oneWeekAgo).length || Math.min(validRecords.length, 5),
    senior: validRecords.filter((r) => parseAge(r.age) >= 60).length,
    chronic: validRecords.filter((r) => parseAge(r.age) >= 45).length,
  };

  return ApiResponse.success(res, stats, 'Marketing audience statistics fetched', 200);
});

// 6. Execute Bulk Broadcast Campaign
export const broadcastCampaign = asyncHandler(async (req, res) => {
  const { campaignTitle, audience, templateName, templateLanguage, templateParameters, messageBody, targetBranch } = req.body;

  if (!campaignTitle || !templateName) {
    return ApiResponse.error(res, 'Campaign title and template name are required', 400);
  }

  // Fetch real recipient phone numbers from OP Records in MongoDB
  const query = {};
  if (targetBranch && targetBranch !== 'All') {
    const branchKeyword = targetBranch.replace(/^Krishna\s+Hospital\s+/i, '').trim();
    const branchRegex = new RegExp(branchKeyword, 'i');
    query.$or = [
      { branch: branchRegex },
      { branchCode: branchRegex },
    ];
  }

  const records = await OPRecord.find(query).select('patientName patient phone age createdAt').sort({ createdAt: -1 });

  // Filter numbers based on selected audience
  let recipients = records.filter((r) => r.phone && adapter.validatePhoneNumber(r.phone));

  const parseAge = (ageStr) => {
    if (!ageStr) return 0;
    const num = parseInt(String(ageStr).replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  if (audience === 'Recent Consultations') {
    const recent = recipients.filter((r) => r.createdAt && new Date(r.createdAt) >= oneWeekAgo);
    recipients = recent.length > 0 ? recent : recipients.slice(0, 20);
  } else if (audience === 'Senior Citizens (60+)') {
    recipients = recipients.filter((r) => parseAge(r.age) >= 60);
  } else if (audience === 'Chronic Care Patients') {
    recipients = recipients.filter((r) => parseAge(r.age) >= 45);
  }

  // Deduplicate phone numbers
  const phoneMap = new Map();
  recipients.forEach((r) => {
    const formatted = adapter.formatPhoneNumber(r.phone);
    if (!phoneMap.has(formatted)) {
      phoneMap.set(formatted, r);
    }
  });

  const uniqueRecipients = Array.from(phoneMap.values());
  const totalCount = uniqueRecipients.length;

  if (totalCount === 0) {
    return ApiResponse.error(res, 'No valid patient phone numbers found for the selected audience scope', 400);
  }

  // Create Campaign Record in MongoDB
  const campaignRecord = await WhatsAppCampaign.create({
    campaignTitle,
    audience,
    templateName,
    templateLanguage: templateLanguage || 'en_US',
    messageBody: messageBody || '',
    totalRecipients: totalCount,
    sentCount: 0,
    failedCount: 0,
    status: 'Sending',
    branch: targetBranch || 'All',
  });

  // Asynchronous Campaign Batch Dispatcher
  (async () => {
    let successCount = 0;
    let failCount = 0;

    let expectedParamCount = null;
    try {
      const dbTpl = await WhatsAppMetaTemplate.findOne({ name: templateName.trim() });
      if (dbTpl) {
        const varMatches = [...(dbTpl.bodyText || '').matchAll(/\{\{(\d+)\}\}/g)];
        if (varMatches.length > 0) {
          expectedParamCount = Math.max(...varMatches.map((m) => parseInt(m[1], 10) || 1));
        } else {
          expectedParamCount = 0;
        }
      } else if (templateName.trim() === 'hello_world') {
        expectedParamCount = 0;
      }
    } catch (err) {
      console.warn('[WhatsApp Campaign] Template DB lookup warning:', err.message);
    }

    for (const patient of uniqueRecipients) {
      const patientName = patient.patientName || patient.patient || 'Patient';
      const formattedPhone = adapter.formatPhoneNumber(patient.phone);

      let langToUse = templateLanguage || 'en_US';
      let params = [];
      let headerMediaUrl = undefined;

      if (templateName.trim() === 'hello_world') {
        langToUse = 'en_US';
        params = [];
      } else if (templateName.trim() === 'krishna_hospitals_inauguration') {
        langToUse = 'te';
        headerMediaUrl = 'https://scontent.whatsapp.net/v/t61.29466-34/794645776_1589941262774766_5351474244715672565_n.jpg?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=3D0VwxSip0wQ7kNvwEs-tDR&_nc_oc=AdpKPTo8wlTaLpZ3YgKyb7dideUn1ROzPm5EX0-hzBTe9B3Z8SUtnf55FZqaMoGjUumHM96YkBYf3VSNZ-Zw_ltN&_nc_zt=3&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=S6uP17hj6hnNQJmSRcQ6wg&_nc_tpa=Q5bMBQLJHaJNYboOChcVQ_bU_A3x2XB_pSgAynZm6khtaYsuw6pb6elIBd8ou6AeSvPaImpHzyH46Mlf0w&oh=01_Q5Aa5gG0JZfG8BtlH_zgruBLKl9zpjOLL_F2Gumgp-JSwDmk8w&oe=6AC8B7B5';
        params = [
          '15 సెప్టెంబర్ 2026',
          'ఉదయం 10:00 గంటలకు',
          'కృష్ణ హాస్పిటల్స్, Guntur',
          '8074499548',
        ];
      } else {
        langToUse = templateLanguage || 'en_US';
        let rawParams = [];
        if (templateParameters && Array.isArray(templateParameters) && templateParameters.length > 0) {
          rawParams = templateParameters.map((p) =>
            String(p)
              .replace('{patient_name}', patientName)
              .replace('{hospital_name}', 'Krishna Hospitals')
              .replace('{doctor_name}', 'Dr. Vijaywada')
              .replace('{date}', '15th Sept 2026')
          );
        } else {
          rawParams = [patientName, 'Dr. Vijaywada', '15th Sept 2026', '10:00 AM', 'Krishna Hospitals'];
        }

        if (expectedParamCount === 0) {
          params = [];
        } else if (expectedParamCount !== null && expectedParamCount > 0) {
          params = rawParams.slice(0, expectedParamCount);
          const presets = [patientName, 'Dr. Vijaywada', '15th Sept 2026', '10:00 AM', 'Krishna Hospitals'];
          while (params.length < expectedParamCount) {
            params.push(presets[params.length % presets.length]);
          }
        } else {
          params = rawParams;
        }
      }

      let result = await adapter.send({
        phoneNumber: formattedPhone,
        messageType: 'template',
        templateName: templateName.trim(),
        templateLanguage: langToUse,
        templateParameters: params,
        headerMediaUrl,
      });

      // Fallback 1: Handle Meta Code 132000 (Parameter count mismatch)
      if (!result.success && result.errorCode === 132000) {
        const paramOptions = params.length > 0 ? [[], [patientName], [patientName, 'Krishna Hospitals']] : [[patientName]];
        for (const altParams of paramOptions) {
          result = await adapter.send({
            phoneNumber: formattedPhone,
            messageType: 'template',
            templateName: templateName.trim(),
            templateLanguage: langToUse,
            templateParameters: altParams,
            headerMediaUrl,
          });
          if (result.success) break;
        }
      }

      // Fallback 2: Handle Meta Code 132001 (Template language mismatch)
      if (!result.success && result.errorCode === 132001) {
        const fallbacks = ['te', 'en', 'en_US'];
        for (const fbLang of fallbacks) {
          if (fbLang === langToUse) continue;
          result = await adapter.send({
            phoneNumber: formattedPhone,
            messageType: 'template',
            templateName: templateName.trim(),
            templateLanguage: fbLang,
            templateParameters: params,
            headerMediaUrl,
          });
          if (result.success) break;
        }
      }

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay between API dispatches to respect rate limits
      await new Promise((r) => setTimeout(r, 100));
    }

    campaignRecord.sentCount = successCount;
    campaignRecord.failedCount = failCount;
    campaignRecord.status = 'Completed';
    await campaignRecord.save();
  })();

  return ApiResponse.success(
    res,
    {
      campaignId: campaignRecord._id,
      totalRecipients: totalCount,
      title: campaignTitle,
    },
    `Bulk WhatsApp campaign "${campaignTitle}" initiated for ${totalCount} patients!`,
    200
  );
});

// 7. Get Approved Templates directly from Meta Graph API
export const getTemplates = asyncHandler(async (req, res) => {
  const { accessToken } = await adapter.getDynamicCredentials();
  const dbConfig = await WhatsAppConfig.findOne({ isConfigured: true }).sort({ updatedAt: -1 });
  const wabaId = dbConfig?.wabaId || process.env.WHATSAPP_WABA_ID || '1956272015332745';

  if (!accessToken || !wabaId) {
    return ApiResponse.success(res, [], 'Meta credentials not configured', 200);
  }

  try {
    const url = `https://graph.facebook.com/v22.0/${wabaId}/message_templates?limit=100`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      return ApiResponse.success(res, [], 'Failed to fetch templates from Meta', 200);
    }

    const data = await resp.json();
    const approvedTemplates = (data.data || []).filter((t) => t.status === 'APPROVED');
    return ApiResponse.success(res, approvedTemplates, 'Templates fetched from Meta', 200);
  } catch (err) {
    console.warn('[WhatsApp] Error fetching templates:', err.message);
    return ApiResponse.success(res, [], 'Error fetching templates', 200);
  }
});

// 8. Get Campaign Audit History Logs
export const getCampaigns = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const query = {};
  if (branch && branch !== 'All') {
    const branchKeyword = branch.replace(/^Krishna\s+Hospital\s+/i, '').trim();
    const branchRegex = new RegExp(branchKeyword, 'i');
    query.$or = [
      { branch: branchRegex },
      { branch: 'All' },
    ];
  }
  const campaigns = await WhatsAppCampaign.find(query).sort({ createdAt: -1 }).limit(50);
  return ApiResponse.success(res, campaigns, 'Campaign audit history logs fetched', 200);
});

// 9. Get AI Auto-Responder Config
export const getAIConfig = asyncHandler(async (req, res) => {
  let dbConfig = await WhatsAppAIConfig.findOne().sort({ updatedAt: -1 });
  const apiKey = dbConfig?.openaiApiKey || process.env.OPENAI_API_KEY || '';

  return ApiResponse.success(
    res,
    {
      isAiEnabled: dbConfig ? dbConfig.isAiEnabled : true,
      modelName: dbConfig?.modelName || 'gpt-4o-mini',
      hasApiKey: Boolean(apiKey),
      maskedApiKey: apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : '',
    },
    'AI Auto-responder config fetched',
    200
  );
});

// 10. Save AI Auto-Responder Config
export const saveAIConfig = asyncHandler(async (req, res) => {
  const { openaiApiKey, isAiEnabled, modelName } = req.body;

  let dbConfig = await WhatsAppAIConfig.findOne();
  if (!dbConfig) {
    dbConfig = new WhatsAppAIConfig();
  }

  if (openaiApiKey && !openaiApiKey.includes('...')) dbConfig.openaiApiKey = openaiApiKey.trim();
  if (typeof isAiEnabled === 'boolean') dbConfig.isAiEnabled = isAiEnabled;
  if (modelName) dbConfig.modelName = modelName.trim();

  await dbConfig.save();

  return ApiResponse.success(
    res,
    { isAiEnabled: dbConfig.isAiEnabled, modelName: dbConfig.modelName },
    'AI Auto-responder settings updated successfully',
    200
  );
});

// 11. Test AI Response Generation (Playground Sandbox)
export const testAIReply = asyncHandler(async (req, res) => {
  const { patientName, patientMessage } = req.body;

  if (!patientMessage || !patientMessage.trim()) {
    return ApiResponse.error(res, 'Patient test message is required', 400);
  }

  const aiReplyText = await generateHospitalAIReply('sandbox-test-number', patientName || 'Patient', patientMessage.trim());

  return ApiResponse.success(
    res,
    {
      patientMessage,
      aiReplyText,
      modelName: 'gpt-4o-mini',
    },
    'AI test reply generated successfully',
    200
  );
});

// 12. Get WhatsApp Patient Chat History Logs
export const getChatHistory = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const query = {};
  if (branch && branch !== 'All') {
    const branchKeyword = branch.replace(/^Krishna\s+Hospital\s+/i, '').trim();
    const branchRegex = new RegExp(branchKeyword, 'i');

    const branchRecords = await OPRecord.find({
      $or: [
        { branch: branchRegex },
        { branchCode: branchRegex },
      ],
    }).select('phone');

    const branchPhones = branchRecords
      .map((r) => r.phone ? String(r.phone).replace(/\D/g, '').slice(-10) : null)
      .filter(Boolean);

    const phoneConditions = branchPhones.map((p) => ({ phone: new RegExp(p + '$') }));

    query.$or = [
      { branch: branchRegex },
      ...(phoneConditions.length > 0 ? phoneConditions : []),
    ];
  }
  const logs = await WhatsAppMessageLog.find(query).sort({ createdAt: -1 }).limit(100);
  return ApiResponse.success(res, logs, 'WhatsApp chat history logs fetched', 200);
});

// 13. Get All Patient Conversation Threads (grouped by phone)
export const getConversations = asyncHandler(async (req, res) => {
  const { branch } = req.query;
  const pipeline = [];

  if (branch && branch !== 'All') {
    const branchKeyword = branch.replace(/^Krishna\s+Hospital\s+/i, '').trim();
    const branchRegex = new RegExp(branchKeyword, 'i');

    const branchRecords = await OPRecord.find({
      $or: [
        { branch: branchRegex },
        { branchCode: branchRegex },
      ],
    }).select('phone');

    const branchPhones = branchRecords
      .map((r) => r.phone ? String(r.phone).replace(/\D/g, '').slice(-10) : null)
      .filter(Boolean);

    const phoneConditions = branchPhones.map((p) => ({ phone: new RegExp(p + '$') }));

    pipeline.push({
      $match: {
        $or: [
          { branch: branchRegex },
          ...(phoneConditions.length > 0 ? phoneConditions : []),
        ],
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$phone',
        phone: { $first: '$phone' },
        patientName: { $first: '$senderName' },
        lastMessage: { $first: '$messageText' },
        lastMessageTime: { $first: '$createdAt' },
        lastDirection: { $first: '$direction' },
        lastSenderType: { $first: '$senderType' },
        branch: { $first: '$branch' },
        totalMessages: { $sum: 1 },
      },
    },
    { $sort: { lastMessageTime: -1 } }
  );

  const rawThreads = await WhatsAppMessageLog.aggregate(pipeline);

  // Fetch all chat modes from WhatsAppChatState
  const chatStates = await WhatsAppChatState.find({});
  const modeMap = new Map();
  chatStates.forEach((cs) => {
    const cleanP = String(cs.phone).replace(/\D/g, '').slice(-10);
    if (cleanP) modeMap.set(cleanP, cs.mode);
  });

  // Fetch registered patients from OPRecord to resolve real patient names
  const opRecords = await OPRecord.find({}).select('patientName patient phone');
  const patientNameMap = new Map();
  opRecords.forEach((rec) => {
    const pName = rec.patientName || rec.patient;
    const cleanP = rec.phone ? String(rec.phone).replace(/\D/g, '').slice(-10) : '';
    if (pName && cleanP) {
      patientNameMap.set(cleanP, pName);
    }
  });

  const threads = rawThreads.map((t) => {
    const cleanP = String(t.phone).replace(/\D/g, '').slice(-10);
    const resolvedName = patientNameMap.get(cleanP) || (t.patientName && t.patientName !== 'Patient' ? t.patientName : '') || `Patient (${t.phone ? t.phone.slice(-4) : 'User'})`;
    const mode = modeMap.get(cleanP) || 'ai';

    return {
      ...t,
      patientName: resolvedName,
      mode: mode,
    };
  });

  return ApiResponse.success(res, threads, 'Patient conversation threads fetched', 200);
});

// 16. Update Conversation AI vs Human Mode Toggle
export const updateChatMode = asyncHandler(async (req, res) => {
  const { phone, mode } = req.body;
  if (!phone || !mode || !['ai', 'human'].includes(mode)) {
    return ApiResponse.error(res, 'Valid phone number and mode (ai or human) are required', 400);
  }

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

  const chatState = await WhatsAppChatState.findOneAndUpdate(
    { $or: [{ phone: cleanPhone }, { phone: phone }] },
    { phone: cleanPhone, mode, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  return ApiResponse.success(
    res,
    { phone: cleanPhone, mode: chatState.mode },
    `Chat mode set to ${chatState.mode.toUpperCase()} for ${phone}`,
    200
  );
});

// 14. Get Full Chat History for a Specific Patient Phone
export const getConversationMessages = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  if (!phone) {
    return ApiResponse.error(res, 'Phone number is required', 400);
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const messages = await WhatsAppMessageLog.find({
    $or: [{ phone: cleanPhone }, { phone: new RegExp(cleanPhone + '$') }],
  }).sort({ createdAt: 1 });

  return ApiResponse.success(res, messages, `Messages fetched for ${cleanPhone}`, 200);
});

// 15. Staff Manual WhatsApp Reply Dispatcher
export const sendManualReply = asyncHandler(async (req, res) => {
  const { phone, messageText, staffName, branch } = req.body;

  if (!phone || !messageText || !messageText.trim()) {
    return ApiResponse.error(res, 'Phone number and message text are required', 400);
  }

  const formattedPhone = adapter.formatPhoneNumber(phone);
  const result = await adapter.send({
    phoneNumber: formattedPhone,
    messageType: 'text',
    textContent: messageText.trim(),
  });

  if (!result.success) {
    return ApiResponse.error(res, result.error || 'Failed to send WhatsApp reply', 400);
  }

  let patientBranch = branch || 'All';
  if (patientBranch === 'All') {
    try {
      const cleanDigits = String(phone).replace(/\D/g, '').slice(-10);
      const opRec = await OPRecord.findOne({ phone: new RegExp(cleanDigits + '$') }).select('branch');
      if (opRec && opRec.branch) patientBranch = opRec.branch;
    } catch (err) {}
  }

  // Save staff message into WhatsAppMessageLog
  const chatLog = await WhatsAppMessageLog.create({
    phone: formattedPhone,
    senderName: staffName || 'Reception Staff',
    direction: 'outbound',
    messageText: messageText.trim(),
    senderType: 'staff',
    messageId: result.messageId || '',
    branch: patientBranch,
  });

  return ApiResponse.success(res, chatLog, 'Manual WhatsApp message sent successfully', 200);
});
