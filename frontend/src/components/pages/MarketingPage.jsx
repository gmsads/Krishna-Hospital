import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Phone, Key, Settings, ShieldCheck, Sparkles, Building2, Clock, CheckCheck, RefreshCw } from 'lucide-react';

export function MarketingPage({ notify, effectiveBranch = 'All' }) {
  const [audience, setAudience] = useState('All OP Patients');
  const [campaignTitle, setCampaignTitle] = useState('Comprehensive Health Checkup Offer');
  const [templateName, setTemplateName] = useState('opd_health_checkup_offer');
  const [templateLanguage, setTemplateLanguage] = useState('en_US');
  const [message, setMessage] = useState(
    'Dear {patient_name}, Krishna Hospitals is offering a 20% discount on OPD Health Checkups & Pathology Tests this month. Book your appointment today or reply to this WhatsApp message for details. Stay Healthy!'
  );

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [configSource, setConfigSource] = useState('');

  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [aiModelName, setAiModelName] = useState('gpt-4o-mini');
  const [hasApiKey, setHasApiKey] = useState(false);

  const [metaTemplates, setMetaTemplates] = useState([]);
  const [audienceStats, setAudienceStats] = useState({ all: 0, recent: 0, senior: 0, chronic: 0 });
  const [sending, setSending] = useState(false);
  const [sentLog, setSentLog] = useState(null);
  const [campaignLogs, setCampaignLogs] = useState([]);
  const [savingConfig, setSavingConfig] = useState(false);

  const [aiTestPrompt, setAiTestPrompt] = useState('What are the OPD consultation timings and fee for Dr. Vijaywada?');
  const [aiTestReply, setAiTestReply] = useState('');
  const [testingAi, setTestingAi] = useState(false);
  const [chatLogs, setChatLogs] = useState([]);
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  // Fetch Meta Credentials Config & Templates on Mount
  useEffect(() => {
    fetchConfig();
    fetchAIConfig();
    fetchTemplates();
  }, []);

  // Fetch Live Audience Stats, Campaigns & Chat logs whenever branch filter changes
  useEffect(() => {
    fetchAudienceStats();
    fetchCampaignLogs();
    fetchChatLogs();
  }, [effectiveBranch]);

  const fetchAIConfig = () => {
    fetch('http://localhost:5000/api/v1/marketing/ai-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setIsAiEnabled(data.data.isAiEnabled);
          setAiModelName(data.data.modelName || 'gpt-4o-mini');
          setHasApiKey(data.data.hasApiKey);
          if (data.data.maskedApiKey) setOpenaiApiKey(data.data.maskedApiKey);
        }
      })
      .catch((err) => console.warn('Could not fetch AI config:', err.message));
  };

  const fetchChatLogs = () => {
    fetch(`http://localhost:5000/api/v1/marketing/chat-history?branch=${encodeURIComponent(effectiveBranch)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setChatLogs(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch chat logs:', err.message));
  };

  const handleSaveAIConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingAiConfig(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/marketing/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiApiKey,
          isAiEnabled,
          modelName: aiModelName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify && notify('OpenAI Auto-Responder settings saved successfully!');
        fetchAIConfig();
      } else {
        notify && notify(data.message || 'Failed to save AI config');
      }
    } catch (err) {
      notify && notify('Network error saving AI config');
    } finally {
      setSavingAiConfig(false);
    }
  };

  const handleTestAIReply = async () => {
    if (!aiTestPrompt.trim()) return;
    setTestingAi(true);
    setAiTestReply('');
    try {
      const res = await fetch('http://localhost:5000/api/v1/marketing/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: 'Test Patient',
          patientMessage: aiTestPrompt.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.aiReplyText) {
        setAiTestReply(data.data.aiReplyText);
      } else {
        setAiTestReply(data.message || 'Failed to generate AI reply. Ensure OpenAI API Key is valid.');
      }
    } catch (err) {
      setAiTestReply('Error connecting to AI Auto-responder backend endpoint.');
    } finally {
      setTestingAi(false);
    }
  };

  const fetchConfig = () => {
    fetch('http://localhost:5000/api/v1/marketing/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setIsConfigured(data.data.isConfigured);
          if (data.data.source) setConfigSource(data.data.source);
          if (data.data.rawPhoneNumberId) setPhoneNumberId(data.data.rawPhoneNumberId);
          if (data.data.defaultTemplate) setTemplateName(data.data.defaultTemplate);
        }
      })
      .catch((err) => console.warn('Could not fetch marketing config:', err.message));
  };

  const fetchTemplates = () => {
    fetch('http://localhost:5000/api/v1/marketing/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setMetaTemplates(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch Meta templates:', err.message));
  };

  const fetchAudienceStats = () => {
    fetch(`http://localhost:5000/api/v1/marketing/stats?branch=${encodeURIComponent(effectiveBranch)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAudienceStats(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch audience stats:', err.message));
  };

  const fetchCampaignLogs = () => {
    fetch(`http://localhost:5000/api/v1/marketing/campaigns?branch=${encodeURIComponent(effectiveBranch)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCampaignLogs(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch campaign logs:', err.message));
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/marketing/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId,
          accessToken,
          appSecret,
          defaultTemplate: templateName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsConfigured(true);
        setShowConfigModal(false);
        fetchConfig();
        notify && notify('Meta WhatsApp Cloud API credentials saved successfully!');
      } else {
        notify && notify(data.message || 'Failed to save Meta credentials');
      }
    } catch (err) {
      notify && notify('Network error saving Meta credentials');
    } finally {
      setSavingConfig(false);
    }
  };

  const getRecipientCount = () => {
    switch (audience) {
      case 'All OP Patients': return audienceStats.all;
      case 'Recent Consultations': return audienceStats.recent;
      case 'Senior Citizens (60+)': return audienceStats.senior;
      case 'Chronic Care Patients': return audienceStats.chronic;
      default: return audienceStats.all;
    }
  };

  const handleSendBroadcast = async () => {
    if (!campaignTitle.trim() || !templateName.trim()) {
      notify && notify('Please enter campaign title and select template name.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignTitle: campaignTitle.trim(),
          audience,
          templateName: templateName.trim(),
          templateLanguage,
          messageBody: message,
          templateParameters: templateName.trim() === 'hello_world' ? [] : ['{patient_name}', '{hospital_name}'],
          targetBranch: effectiveBranch,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const count = data.data?.totalRecipients || getRecipientCount();
        setSentLog({
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count,
          title: campaignTitle,
        });
        notify && notify(`Official Meta Cloud API broadcast queued for ${count} patients!`);
        fetchCampaignLogs();
        fetchAudienceStats();
      } else {
        notify && notify(data.message || 'Campaign broadcast failed. Ensure Meta API token is valid.');
      }
    } catch (err) {
      notify && notify('Error launching broadcast: Ensure backend API is online.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="page-heading" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eyebrow">Executive Marketing Suite</div>
          <h1>Official Meta WhatsApp Cloud API Marketing</h1>
          <p>Send official, verified bulk WhatsApp campaign templates, promotional offers, and appointment reminders.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isConfigured ? '#dcfce7' : '#fef3c7',
              color: isConfigured ? '#15803d' : '#b45309',
              border: isConfigured ? '1px solid #86efac' : '1px solid #fde68a',
            }}
          >
            <ShieldCheck size={16} />
            {isConfigured ? `META API CONNECTED (${configSource || 'ACTIVE'})` : 'META CREDENTIALS REQUIRED'}
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowConfigModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Settings size={15} /> Configure Meta Credentials
          </button>
        </div>
      </div>

      {/* Meta API Settings Modal */}
      {showConfigModal && (
        <div className="modal-overlay" style={{ display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '540px', width: '100%', padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="#1769d7" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Meta WhatsApp Cloud API Credentials</h3>
              </div>
              <button className="icon-button" onClick={() => setShowConfigModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveConfig} style={{ display: 'grid', gap: '14px' }}>
              <div className="field">
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Phone Number ID (Numeric) *</span>
                <input
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="e.g. 10984712039485"
                  required
                  style={{ padding: '10px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Permanent System User Access Token (EAAG...) *</span>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Paste long Meta Access Token"
                  required
                  style={{ padding: '10px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="field">
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>App Secret (Optional for Webhook Verification)</span>
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="Meta App Secret"
                  style={{ padding: '10px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="primary-button" disabled={savingConfig} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingConfig ? 'Saving...' : 'Save Meta Credentials'}
                </button>
                <button type="button" className="secondary-button" onClick={() => setShowConfigModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ width: '100%', boxSizing: 'border-box' }}>
        {/* Campaign Composer */}
        <section className="panel" style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #edf2f8', paddingBottom: '12px', marginBottom: '16px' }}>
            <MessageSquare size={20} color="#25D366" />
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1a3354' }}>Compose Official Meta WhatsApp Broadcast</h3>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Audience Selector */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Select Target Patient Audience *</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff', fontWeight: '700', color: '#1769d7', width: '100%', boxSizing: 'border-box' }}
              >
                <option value="All OP Patients">All Registered OP Patients ({audienceStats.all} Patients in DB)</option>
                <option value="Recent Consultations">Recent OPD Consultations ({audienceStats.recent} Patients)</option>
                <option value="Senior Citizens (60+)">Senior Citizens 60+ ({audienceStats.senior} Patients)</option>
                <option value="Chronic Care Patients">Chronic Care Follow-up ({audienceStats.chronic} Patients)</option>
              </select>
            </div>

            {/* Approved Meta Template Picker */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Official Meta Approved Template *</span>
              <select
                value={templateName}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setTemplateName(selectedName);

                  const found = metaTemplates.find((t) => t.name === selectedName);
                  if (found) {
                    setTemplateLanguage(found.language || 'en');
                    const bodyComp = (found.components || []).find((c) => c.type === 'BODY');
                    if (bodyComp && bodyComp.text) {
                      setMessage(bodyComp.text.replace(/\{\{1\}\}/g, '{patient_name}').replace(/\{\{2\}\}/g, '{hospital_name}'));
                    }
                  } else {
                    if (selectedName === 'opd_health_checkup_offer') {
                      setTemplateLanguage('en');
                      setMessage('Dear {patient_name}, Krishna Hospitals ({hospital_name}) is offering a 20% discount on OPD Health Checkups & Pathology Tests this month. Book your appointment today!');
                    } else if (selectedName === 'hello_world') {
                      setTemplateLanguage('en_US');
                      setMessage('Welcome to Krishna Hospitals ({hospital_name}), {patient_name}! We are happy to assist you.');
                    }
                  }
                }}
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff', fontWeight: '700', color: '#0f172a', width: '100%', boxSizing: 'border-box' }}
              >
                {metaTemplates.length > 0 ? (
                  metaTemplates.map((t) => (
                    <option key={t.id || t.name} value={t.name}>
                      {t.name} ({t.category || 'APPROVED'} - Lang: {t.language})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="opd_health_checkup_offer">opd_health_checkup_offer (Marketing - Approved)</option>
                    <option value="krishna_hospitals_inauguration">krishna_hospitals_inauguration (Marketing - Approved)</option>
                    <option value="hello_world">hello_world (Meta Sample Template)</option>
                  </>
                )}
              </select>
            </div>

            {/* Campaign Title */}
            <div className="field">
              <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>Campaign Name / Identification *</span>
              <input
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g. Free Diabetes Checkup Drive"
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', background: '#fff', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Message Body Content */}
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ color: '#4a5e7a', fontSize: '12px', fontWeight: '700' }}>WhatsApp Template Content Body *</span>
                <span style={{ fontSize: '11px', color: '#1769d7' }}>Injected Variables: <code>{"{patient_name}"}</code>, <code>{"{hospital_name}"}</code></span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Write your bulk WhatsApp broadcast message..."
                style={{ padding: '12px 14px', border: '1px solid #dde7f1', borderRadius: '9px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Broadcast Action Button */}
            <div style={{ paddingTop: '10px' }}>
              <button
                type="button"
                className="primary-button"
                style={{ width: '100%', padding: '14px', justifyContent: 'center', background: '#25D366', borderColor: '#25D366', fontSize: '14px', boxSizing: 'border-box' }}
                onClick={handleSendBroadcast}
                disabled={sending}
              >
                <Send size={18} /> {sending ? `Dispatching Meta Broadcast (${getRecipientCount()} Patients)...` : `Execute Meta WhatsApp Broadcast (${getRecipientCount()} Patients)`}
              </button>
            </div>

            {sentLog && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9px', padding: '14px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: '700', fontSize: '13px' }}>
                  <CheckCircle2 size={18} /> Broadcast Successfully Initiated via Meta Cloud API!
                </div>
                <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
                  Campaign "<strong>{sentLog.title}</strong>" queued for <strong>{sentLog.count} patients</strong> via Meta Graph API at {sentLog.timestamp}.
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Live WhatsApp Preview Phone Card */}
        <section className="panel" style={{ background: '#efeae2', borderColor: '#d1c7bd', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1c7bd', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} color="#075e54" />
              <strong style={{ fontSize: '14px', color: '#075e54' }}>Meta WhatsApp Live Preview</strong>
            </div>
            <span style={{ fontSize: '11px', background: '#25D366', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>VERIFIED BUSINESS</span>
          </div>

          <div style={{ background: '#075e54', color: '#fff', padding: '10px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', color: '#075e54', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '14px' }}>
              K
            </div>
            <div>
              <strong style={{ fontSize: '13px', display: 'block' }}>Krishna Hospitals Official</strong>
              <span style={{ fontSize: '10px', opacity: 0.85 }}>Meta Official WhatsApp Account</span>
            </div>
          </div>

          {/* WhatsApp Chat Bubble */}
          <div style={{ background: '#e5ddd5', padding: '16px', borderRadius: '0 0 8px 8px', minHeight: '260px' }}>
            <div style={{ background: '#ffffff', borderRadius: '8px 8px 8px 0', padding: '12px', maxWidth: '88%', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', fontSize: '13px', color: '#111b21', lineHeight: '1.45', position: 'relative' }}>
              <div style={{ fontSize: '11px', color: '#128c7e', fontWeight: '700', marginBottom: '4px' }}>Krishna Hospitals</div>
              {message.replace('{patient_name}', 'Ananya Sharma').replace('{hospital_name}', 'Krishna Hospitals')}

              {/* Interactive Quick Reply Buttons Preview */}
              <div style={{ marginTop: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '8px', display: 'grid', gap: '6px' }}>
                <div style={{ background: '#f0f9ff', color: '#1769d7', padding: '6px', textAlign: 'center', borderRadius: '6px', fontSize: '12px', fontWeight: '700', border: '1px solid #bae6fd' }}>
                  📅 Book Appointment
                </div>
                <div style={{ background: '#f0f9ff', color: '#1769d7', padding: '6px', textAlign: 'center', borderRadius: '6px', fontSize: '12px', fontWeight: '700', border: '1px solid #bae6fd' }}>
                  📞 Call Hospital Desk
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '10px', color: '#667781', marginTop: '6px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px' }}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <CheckCheck size={14} color="#53bdeb" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* OPENAI AI AUTO-RESPONDER CONFIGURATION & PLAYGROUND SANDBOX */}
      <section className="panel full-panel" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} color="#7c3aed" />
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>AI Automated WhatsApp Auto-Responder (OpenAI gpt-4o-mini)</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>24/7 Intelligent Patient Response Engine trained on Krishna Hospitals Doctor List, OPD Fees, Timings & Services.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '6px 12px',
                borderRadius: '16px',
                background: isAiEnabled ? '#f3e8ff' : '#f1f5f9',
                color: isAiEnabled ? '#7e22ce' : '#64748b',
                border: isAiEnabled ? '1px solid #d8b4fe' : '1px solid #cbd5e1',
              }}
            >
              {isAiEnabled ? 'AI AUTO-RESPONDER: ACTIVE (gpt-4o-mini)' : 'AI AUTO-RESPONDER: PAUSED'}
            </span>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const nextState = !isAiEnabled;
                setIsAiEnabled(nextState);
                fetch('http://localhost:5000/api/v1/marketing/ai-config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isAiEnabled: nextState }),
                }).then(() => notify && notify(`AI Auto-responder ${nextState ? 'ACTIVATED' : 'PAUSED'}`));
              }}
              style={{ fontSize: '12px' }}
            >
              {isAiEnabled ? 'Pause AI' : 'Activate AI'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* OpenAI API Key Settings Form */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Key size={18} color="#7c3aed" />
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>OpenAI API Credentials</strong>
            </div>

            <form onSubmit={handleSaveAIConfig} style={{ display: 'grid', gap: '12px' }}>
              <div className="field">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>OpenAI Secret API Key (sk-...) *</span>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="Paste your OpenAI API Key (sk-...)"
                  style={{ padding: '10px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: hasApiKey ? '#15803d' : '#b45309', fontWeight: '700' }}>
                  {hasApiKey ? '✓ Key Configured in System' : '⚠️ Key Required for AI Replies'}
                </span>
                <button type="submit" className="primary-button" disabled={savingAiConfig} style={{ background: '#7c3aed', borderColor: '#7c3aed', padding: '8px 16px', fontSize: '12px' }}>
                  {savingAiConfig ? 'Saving...' : 'Save AI Key'}
                </button>
              </div>
            </form>
          </div>

          {/* AI Live Interactive Playground Sandbox */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={18} color="#2563eb" />
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>Test AI Auto-Responder (Live Sandbox)</strong>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={aiTestPrompt}
                  onChange={(e) => setAiTestPrompt(e.target.value)}
                  placeholder="Type a patient question (e.g. Doctor timings, OPD fee)..."
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleTestAIReply}
                  disabled={testingAi}
                  style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  {testingAi ? 'Simulating...' : 'Test AI Reply'}
                </button>
              </div>

              {aiTestReply && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#0369a1', lineHeight: '1.45' }}>
                  <div style={{ fontWeight: '700', fontSize: '11px', color: '#0284c7', marginBottom: '4px' }}>🤖 OpenAI gpt-4o-mini WhatsApp Response:</div>
                  {aiTestReply}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RECENT PATIENT CHAT HISTORY LOGS */}
      <section className="panel full-panel" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
        <div className="list-toolbar" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>Live Patient WhatsApp Conversations & AI Chat History ({chatLogs.length} Messages)</h2>
            <p>Real-time log of incoming patient messages and 24/7 automated OpenAI replies.</p>
          </div>
          <button className="secondary-button" onClick={fetchChatLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <RefreshCw size={14} /> Refresh Chat Logs
          </button>
        </div>

        <div className="table-scroll" style={{ marginTop: '12px', width: '100%', boxSizing: 'border-box' }}>
          <table>
            <thead>
              <tr>
                <th>Patient Phone</th>
                <th>Sender</th>
                <th>Direction</th>
                <th>Message Content</th>
                <th>Sender Type</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {chatLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No incoming patient WhatsApp messages logged yet. Send a WhatsApp message to test!
                  </td>
                </tr>
              ) : (
                chatLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>{log.phone}</strong>
                    </td>
                    <td>{log.senderName || 'Patient'}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: log.direction === 'inbound' ? '#e0f2fe' : '#dcfce7',
                          color: log.direction === 'inbound' ? '#0369a1' : '#15803d',
                        }}
                      >
                        {log.direction === 'inbound' ? 'INCOMING 📥' : 'OUTGOING 📤'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#334155' }}>{log.messageText}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: log.senderType === 'ai' ? '#7e22ce' : '#0f172a' }}>
                        {log.senderType === 'ai' ? '🤖 Krishna AI' : log.senderType === 'patient' ? '👤 Patient' : '👨‍💼 Staff'}
                      </span>
                    </td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* HISTORICAL CAMPAIGN AUDIT LOGS TABLE */}
      <section className="panel full-panel" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
        <div className="list-toolbar" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>Broadcast Campaign History & Audit Log ({campaignLogs.length} Campaigns)</h2>
            <p>Historical audit of bulk Meta Cloud API campaign dispatches, patient delivery counts, and execution status.</p>
          </div>
          <button className="secondary-button" onClick={fetchCampaignLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>

        <div className="table-scroll" style={{ marginTop: '12px', width: '100%', boxSizing: 'border-box' }}>
          <table>
            <thead>
              <tr>
                <th>Campaign Title</th>
                <th>Target Audience</th>
                <th>Meta Template</th>
                <th>Total Patients</th>
                <th>Delivered</th>
                <th>Status</th>
                <th>Dispatched At</th>
              </tr>
            </thead>
            <tbody>
              {campaignLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No Meta broadcast campaign history recorded yet.
                  </td>
                </tr>
              ) : (
                campaignLogs.map((c) => (
                  <tr key={c._id || c.id}>
                    <td>
                      <strong>{c.campaignTitle}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: '#1769d7', background: '#f4f8fe', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                        {c.audience}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', color: '#0f172a' }}>{c.templateName}</code>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px' }}>{c.totalRecipients}</strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px', color: '#15803d' }}>{c.sentCount}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: c.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                          color: c.status === 'Completed' ? '#15803d' : '#b45309',
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>{new Date(c.sentAt || c.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default MarketingPage;

