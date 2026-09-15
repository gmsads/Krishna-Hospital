import { WhatsAppAIConfig, WhatsAppMessageLog } from './chat.model.js';
import { Doctor } from '../doctors/doctor.model.js';
import { OPRecord } from '../op-records/op-record.model.js';

export async function getHospitalDatabaseContext() {
  let doctorsList = [];
  try {
    const doctors = await Doctor.find({ status: 'Active' }).select('name department phone branch');
    if (doctors && doctors.length > 0) {
      doctorsList = doctors.map((d) => `• Dr. ${d.name} (${d.department || 'General Medicine'} - ${d.branch || 'Guntur Branch'})`);
    }
  } catch (err) {
    console.warn('[WhatsApp AI] Could not query doctors list:', err.message);
  }

  if (doctorsList.length === 0) {
    doctorsList = [
      '• Dr. Vijaywada (General Medicine & Diabetology)',
      '• Dr. Balu (Orthopedics & Joint Replacement)',
      '• Dr. Ananya Sharma (Gynecology & Obstetrics)',
      '• Dr. Prasad (Pediatrics & Child Health)',
    ];
  }

  return `
KRISHNA HOSPITALS OFFICIAL DATABASE & SERVICE DIRECTORY:
- Hospital Name: Krishna Hospitals (General & Multi-Specialty Hospital)
- Main Branches: Guntur Branch, Vijayawada Branch
- OPD Consultation Fee: ₹300 (Validity: 15 Days for free re-consultation)
- OPD Timings: Morning 09:00 AM - 01:00 PM | Evening 04:00 PM - 09:00 PM
- Emergency & Ambulance Services: Available 24 Hours / 7 Days
- Pathology Laboratory & Diagnostic Services: Available 24/7 (Blood Tests, HbA1c, Lipid Profile, Thyroid, Urine Analysis)
- Pharmacy: 24/7 In-House Hospital Pharmacy
- Hospital Emergency Helpline Phone: +91 80744 99548 / +91 89780 72410

AVAILABLE DOCTORS:
${doctorsList.join('\n')}

SPECIAL INSTRUCTIONS:
1. Always be polite, empathetic, and professional as the Official Krishna Hospitals AI Assistant.
2. Answer patient queries directly and concisely (under 150 words).
3. Detect the patient's language (English, Telugu, Hindi) and reply in the same language.
4. If a patient wants to book an OPD appointment, ask for their preferred Date, Time, and Doctor name.
5. For severe medical emergencies, advise immediate visit to Krishna Hospitals Casualty/Emergency Ward.
`;
}

export async function generateHospitalAIReply(patientPhone, patientName = 'Patient', patientMessage = '') {
  if (!patientMessage || !patientMessage.trim()) return null;

  // Fetch AI Config from DB or Environment
  let dbConfig = await WhatsAppAIConfig.findOne().sort({ updatedAt: -1 });
  const apiKey = dbConfig?.openaiApiKey || process.env.OPENAI_API_KEY || '';
  const isEnabled = dbConfig ? dbConfig.isAiEnabled : true;
  const modelName = dbConfig?.modelName || 'gpt-4o-mini';

  if (!isEnabled) {
    console.log('[WhatsApp AI] AI Auto-responder is currently PAUSED by Admin.');
    return null;
  }

  if (!apiKey) {
    console.warn('[WhatsApp AI] No OpenAI API Key found. Returning default fallback greeting.');
    return `Namaste ${patientName}! Thank you for contacting Krishna Hospitals. Our reception team will assist you shortly. For immediate assistance, please call +91 80744 99548.`;
  }

  try {
    const hospitalContext = await getHospitalDatabaseContext();

    // Fetch last 6 chat history messages for context memory
    let conversationHistory = [];
    try {
      const recentLogs = await WhatsAppMessageLog.find({ phone: patientPhone }).sort({ createdAt: -1 }).limit(6);
      conversationHistory = recentLogs.reverse().map((log) => ({
        role: log.direction === 'inbound' ? 'user' : 'assistant',
        content: log.messageText,
      }));
    } catch (err) {
      console.warn('[WhatsApp AI] Could not fetch chat history memory:', err.message);
    }

    const messages = [
      {
        role: 'system',
        content: hospitalContext,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: `[Patient Name: ${patientName}, Phone: ${patientPhone}]: ${patientMessage}`,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[OpenAI API Error]', response.status, errData.error?.message);
      return `Dear ${patientName}, thank you for contacting Krishna Hospitals. Our reception desk is processing your inquiry and will update you shortly. Helpline: +91 80744 99548.`;
    }

    const data = await response.json();
    const aiReplyText = data.choices?.[0]?.message?.content?.trim();
    return aiReplyText || `Thank you for contacting Krishna Hospitals, ${patientName}. How may we assist you today?`;
  } catch (error) {
    console.error('[WhatsApp AI Exception]', error.message);
    return `Dear ${patientName}, thank you for reaching out to Krishna Hospitals. Our team has received your message. Helpline: +91 80744 99548.`;
  }
}
