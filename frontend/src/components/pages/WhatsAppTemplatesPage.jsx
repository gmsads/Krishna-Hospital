import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Building2,
  Trash2,
  Send,
  Layers,
  Copy,
  Sparkles,
  MessageSquare,
  Smartphone,
  CheckCheck,
} from 'lucide-react';

export function WhatsAppTemplatesPage({ notify, effectiveBranch = 'All' }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Template Drawer Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState('UTILITY');
  const [tplLanguage, setTplLanguage] = useState('en_US');
  const [tplHeaderType, setTplHeaderType] = useState('NONE');
  const [tplHeaderContent, setTplHeaderContent] = useState('');
  const [tplBodyText, setTplBodyText] = useState(
    'Dear {{1}}, Krishna Hospitals OPD Consultation is scheduled with {{2}} on {{3}} at {{4}}. For queries, reply to this message.'
  );
  const [tplFooterText, setTplFooterText] = useState('Krishna Hospitals • Healthcare Excellence');
  const [tplButtons, setTplButtons] = useState([
    { type: 'QUICK_REPLY', text: 'Book OPD' },
    { type: 'PHONE_NUMBER', text: 'Call Desk', phone_number: '+91 80744 99548' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [effectiveBranch]);

  const fetchTemplates = () => {
    setLoading(true);
    fetch('/api/v1/marketing/templates/sync')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTemplates(data.data);
        }
      })
      .catch((err) => console.warn('Could not sync Meta templates:', err.message))
      .finally(() => setLoading(false));
  };

  const handleAddButtonField = () => {
    if (tplButtons.length >= 3) {
      notify && notify('Meta Cloud API supports up to 3 buttons per template');
      return;
    }
    setTplButtons((prev) => [...prev, { type: 'QUICK_REPLY', text: `Option ${prev.length + 1}` }]);
  };

  const handleRemoveButtonField = (index) => {
    setTplButtons((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateButtonField = (index, key, value) => {
    setTplButtons((prev) =>
      prev.map((b, idx) => {
        if (idx !== index) return b;
        const updated = { ...b, [key]: value };
        if (key === 'type') {
          if (value === 'PHONE_NUMBER' && !updated.phone_number) updated.phone_number = '+91 80744 99548';
          if (value === 'URL' && !updated.url) updated.url = 'https://maps.google.com/?q=Krishna+Hospitals';
        }
        return updated;
      })
    );
  };

  const handleInsertVariable = (varNum) => {
    setTplBodyText((prev) => `${prev} {{${varNum}}}`);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!tplName.trim() || !tplBodyText.trim()) {
      notify && notify('Template name and body text are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/marketing/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tplName.trim(),
          category: tplCategory,
          language: tplLanguage,
          headerType: tplHeaderType,
          headerContent: tplHeaderContent.trim(),
          bodyText: tplBodyText.trim(),
          footerText: tplFooterText.trim(),
          buttons: tplButtons.filter((b) => b.text && b.text.trim().length > 0),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify && notify(`Template "${tplName}" submitted to Meta for official verification! Status: ${data.data?.status || 'PENDING'}`);
        setShowCreateModal(false);
        setTplName('');
        fetchTemplates();
      } else {
        notify && notify(data.message || 'Failed to submit template to Meta');
      }
    } catch (err) {
      notify && notify('Error submitting template to Meta Cloud API');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter((tpl) => {
    if (statusFilter === 'APPROVED') return tpl.status === 'APPROVED';
    if (statusFilter === 'PENDING') return tpl.status === 'PENDING' || tpl.status === 'IN_REVIEW';
    if (statusFilter === 'REJECTED') return tpl.status === 'REJECTED';
    return true;
  });

  // Render preview body text with dynamic sample values replacing {{1}}, {{2}}, {{3}}...
  const getRenderedPreviewHTML = () => {
    if (!tplBodyText) return 'Enter your template body text on the left...';
    const presets = [
      'Ananya Sharma',
      'Dr. Vijaywada',
      '15th Sept 2026',
      '10:00 AM',
      'Krishna Hospitals',
      'OPD Clinic',
    ];
    return tplBodyText.replace(/\{\{(\d+)\}\}/g, (match, num) => {
      const idx = parseInt(num, 10) - 1;
      const val = presets[idx] || `Sample ${num}`;
      return `<mark style="background: #fef08a; color: #854d0e; padding: 1px 5px; border-radius: 4px; font-weight: 700; font-style: normal;">${val}</mark>`;
    });
  };

  return (
    <div style={{ padding: '4px 0 24px 0', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* PAGE HEADER */}
      <div className="page-heading" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="#1769d7" /> Meta Cloud API Verification Pipeline
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>Meta Message Templates</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Create, view, and manage Meta-approved WhatsApp message templates with dynamic variables and interactive quick reply buttons.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '16px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: '700', border: '1px solid #bae6fd' }}>
            <Building2 size={14} /> SCOPE: {effectiveBranch.toUpperCase()}
          </span>

          <button className="secondary-button" onClick={fetchTemplates} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Syncing...' : 'Sync Meta Status'}
          </button>

          <button className="primary-button" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: '#1769d7' }}>
            <Plus size={15} /> + Create Meta Template
          </button>
        </div>
      </div>

      {/* FILTER & STATS TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Templates (${templates.length})` },
            { id: 'APPROVED', label: `✓ Approved (${templates.filter((t) => t.status === 'APPROVED').length})` },
            { id: 'PENDING', label: `⏳ Pending (${templates.filter((t) => t.status === 'PENDING' || t.status === 'IN_REVIEW').length})` },
            { id: 'REJECTED', label: `✖ Rejected (${templates.filter((t) => t.status === 'REJECTED').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: statusFilter === tab.id ? '2px solid #1769d7' : '1px solid #cbd5e1',
                background: statusFilter === tab.id ? '#eff6ff' : '#ffffff',
                color: statusFilter === tab.id ? '#1769d7' : '#475569',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
          Showing {filteredTemplates.length} Meta Templates
        </div>
      </div>

      {/* TEMPLATES GRID DISPLAY */}
      {filteredTemplates.length === 0 ? (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', padding: '48px 24px', textAlign: 'center' }}>
          <FileText size={42} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', color: '#1e293b', margin: '0 0 6px 0' }}>No Meta Templates Found</h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto 16px auto' }}>
            Click "+ Create Meta Template" above to compose and submit your first WhatsApp template with custom buttons for official Meta verification.
          </p>
          <button className="primary-button" onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Plus size={16} /> + Create Meta Template Now
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredTemplates.map((tpl) => {
            const isApproved = tpl.status === 'APPROVED';
            const isPending = tpl.status === 'PENDING' || tpl.status === 'IN_REVIEW';
            const isRejected = tpl.status === 'REJECTED';

            const buttonList = tpl.buttons || [];

            return (
              <div
                key={tpl._id || tpl.name}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: `1.5px solid ${isApproved ? '#bbf7d0' : isPending ? '#fde68a' : '#fecaca'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease',
                }}
              >
                {/* CARD HEADER */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: isApproved ? '#f0fdf4' : isPending ? '#fffbeb' : '#fef2f2',
                    borderBottom: `1px solid ${isApproved ? '#dcfce7' : isPending ? '#fef3c7' : '#fee2e2'}`,
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                      {tpl.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                      CATEGORY: {tpl.category || 'UTILITY'} · {tpl.language || 'en_US'}
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '800',
                      background: isApproved ? '#dcfce7' : isPending ? '#fef3c7' : '#fee2e2',
                      color: isApproved ? '#15803d' : isPending ? '#b45309' : '#b91c1c',
                    }}
                  >
                    {isApproved && <CheckCircle2 size={12} />}
                    {isPending && <Clock size={12} />}
                    {isRejected && <AlertCircle size={12} />}
                    {isApproved ? 'APPROVED' : isPending ? 'PENDING' : 'REJECTED'}
                  </span>
                </div>

                {/* WHATSAPP MESSAGE PREVIEW */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      background: '#efeae2',
                      backgroundImage: 'radial-gradient(#cbd5e1 0.75px, transparent 0.75px)',
                      backgroundSize: '12px 12px',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#1e293b',
                      lineHeight: '1.5',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {tpl.headerContent && (
                      <div style={{ fontWeight: '700', marginBottom: '6px', color: '#0f172a' }}>
                        {tpl.headerContent}
                      </div>
                    )}

                    <div style={{ whiteSpace: 'pre-wrap' }}>{tpl.bodyText}</div>

                    {tpl.footerText && (
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                        {tpl.footerText}
                      </div>
                    )}
                  </div>

                  {/* QUICK REPLY BUTTONS PREVIEW */}
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={13} color="#1769d7" /> Configured Quick Reply Buttons:
                    </div>

                    {buttonList.length === 0 ? (
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No quick reply buttons configured</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {buttonList.map((btn, idx) => {
                          const btnText = typeof btn === 'string' ? btn : btn.text || btn.title || `Button ${idx + 1}`;
                          const bType = typeof btn === 'object' && btn.type ? (btn.type || '').toUpperCase() : '';
                          const icon = bType === 'PHONE_NUMBER' ? '📞' : bType === 'URL' ? '🌐' : '💬';
                          const subtitle = typeof btn === 'object' ? (btn.phone_number || btn.phoneNumber || btn.url || '') : '';

                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '8px 12px',
                                background: '#ffffff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                color: bType === 'PHONE_NUMBER' ? '#c2410c' : bType === 'URL' ? '#0369a1' : '#1d4ed8',
                                fontSize: '12px',
                                fontWeight: '700',
                                textAlign: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                              }}
                            >
                              <div>
                                <span>{icon}</span> {btnText}
                              </div>
                              {subtitle && (
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>
                                  {subtitle}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD FOOTER */}
                <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tpl.name);
                      notify && notify(`Template name "${tpl.name}" copied to clipboard!`);
                    }}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={13} /> Copy Name
                  </button>

                  {tpl.metaTemplateId && (
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      ID: {tpl.metaTemplateId.slice(0, 10)}...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DEDICATED CREATE META TEMPLATE MODAL WITH SIDE-BY-SIDE LIVE WHATSAPP PHONE PREVIEW */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal" style={{ width: '920px', maxWidth: '96%', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Create & Submit Meta WhatsApp Template</h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Compose dynamic body content and view live WhatsApp mobile phone preview in real-time.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {/* SIDE-BY-SIDE RESPONSIVE GRID: LEFT FORM, RIGHT REAL-TIME MOBILE PHONE SIMULATOR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
              
              {/* LEFT COLUMN: FORM INPUT CONTROLS */}
              <form onSubmit={handleCreateSubmit} style={{ width: '100%' }}>
                <div style={{ display: 'grid', gap: '14px' }}>
                  {/* TEMPLATE NAME */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      TEMPLATE NAME (Lowercase, underscore) *
                    </label>
                    <input
                      type="text"
                      value={tplName}
                      onChange={(e) => setTplName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      placeholder="e.g. opd_appointment_reminder_v1"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', fontFamily: 'monospace' }}
                    />
                  </div>

                  {/* CATEGORY & LANGUAGE */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>CATEGORY</label>
                      <select value={tplCategory} onChange={(e) => setTplCategory(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff' }}>
                        <option value="UTILITY">UTILITY (Reminders / Appointments / Info)</option>
                        <option value="MARKETING">MARKETING (Health Offers / Updates)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>LANGUAGE</label>
                      <select value={tplLanguage} onChange={(e) => setTplLanguage(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff' }}>
                        <option value="en_US">English (en_US)</option>
                        <option value="te">Telugu (te)</option>
                        <option value="hi">Hindi (hi)</option>
                      </select>
                    </div>
                  </div>

                  {/* HEADER TYPE & CONTENT */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>HEADER TYPE</label>
                      <select value={tplHeaderType} onChange={(e) => setTplHeaderType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff' }}>
                        <option value="NONE">None</option>
                        <option value="TEXT">Text Header</option>
                      </select>
                    </div>

                    {tplHeaderType === 'TEXT' && (
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>HEADER TEXT</label>
                        <input
                          type="text"
                          value={tplHeaderContent}
                          onChange={(e) => setTplHeaderContent(e.target.value)}
                          placeholder="e.g. KRISHNA HOSPITALS NOTICE"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* BODY TEXT WITH MULTIPLE VARIABLE INSERTION CHIPS */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>
                        BODY TEXT (Use {"{{1}}"}, {"{{2}}"} for dynamic patient variables) *
                      </label>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => handleInsertVariable(1)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                          + {"{{1}}"} Patient
                        </button>
                        <button type="button" onClick={() => handleInsertVariable(2)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                          + {"{{2}}"} Doctor
                        </button>
                        <button type="button" onClick={() => handleInsertVariable(3)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                          + {"{{3}}"} Date
                        </button>
                        <button type="button" onClick={() => handleInsertVariable(4)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                          + {"{{4}}"} Time
                        </button>
                        <button type="button" onClick={() => handleInsertVariable(5)} style={{ padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                          + {"{{5}}"} Hospital
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={6}
                      maxLength={1024}
                      value={tplBodyText}
                      onChange={(e) => setTplBodyText(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.5', fontFamily: 'inherit' }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                      {tplBodyText.length} / 1024 characters
                    </div>
                  </div>

                  {/* FOOTER NOTE */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>FOOTER TEXT</label>
                    <input
                      type="text"
                      value={tplFooterText}
                      onChange={(e) => setTplFooterText(e.target.value)}
                      placeholder="e.g. Krishna Hospitals • Healthcare Excellence"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  {/* INTERACTIVE BUTTONS & CTA CALL / LOCATION URL BUILDER */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        <strong style={{ fontSize: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MessageSquare size={14} color="#1769d7" /> Interactive Buttons & Call To Action (Max 3)
                        </strong>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Select Quick Reply, Call Phone Number, or Visit Location URL.</div>
                      </div>
                      {tplButtons.length < 3 && (
                        <button
                          type="button"
                          onClick={handleAddButtonField}
                          style={{ padding: '4px 10px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          + Add Button
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {tplButtons.map((btn, index) => {
                        const bType = btn.type || 'QUICK_REPLY';
                        return (
                          <div key={index} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', display: 'grid', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', width: '60px' }}>Button {index + 1}:</span>
                              
                              {/* Button Action Type Selector */}
                              <select
                                value={bType}
                                onChange={(e) => handleUpdateButtonField(index, 'type', e.target.value)}
                                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: '700', background: '#f8fafc', color: '#0f172a' }}
                              >
                                <option value="QUICK_REPLY">💬 Quick Reply</option>
                                <option value="PHONE_NUMBER">📞 Call Phone Number</option>
                                <option value="URL">🌐 Visit URL / Location</option>
                              </select>

                              {/* Button Label Input */}
                              <input
                                type="text"
                                value={btn.text}
                                onChange={(e) => handleUpdateButtonField(index, 'text', e.target.value)}
                                placeholder={bType === 'PHONE_NUMBER' ? 'e.g. Call Desk' : bType === 'URL' ? 'e.g. View Location' : 'e.g. Book OPD'}
                                maxLength={25}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600' }}
                              />

                              {tplButtons.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveButtonField(index)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                  title="Remove button"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>

                            {/* CONDITIONAL TARGET FIELD FOR PHONE NUMBER */}
                            {bType === 'PHONE_NUMBER' && (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff7ed', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#c2410c', width: '130px' }}>Target Phone Number *</span>
                                <input
                                  type="text"
                                  value={btn.phone_number || ''}
                                  onChange={(e) => handleUpdateButtonField(index, 'phone_number', e.target.value)}
                                  placeholder="e.g. +91 80744 99548"
                                  style={{ flex: 1, padding: '5px 8px', borderRadius: '4px', border: '1px solid #fdba74', fontSize: '12px', fontWeight: '700', color: '#c2410c' }}
                                />
                              </div>
                            )}

                            {/* CONDITIONAL TARGET FIELD FOR URL / LOCATION */}
                            {bType === 'URL' && (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f0f9ff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#0369a1', width: '130px' }}>Target URL / Location *</span>
                                <input
                                  type="url"
                                  value={btn.url || ''}
                                  onChange={(e) => handleUpdateButtonField(index, 'url', e.target.value)}
                                  placeholder="e.g. https://maps.google.com/?q=Krishna+Hospitals"
                                  style={{ flex: 1, padding: '5px 8px', borderRadius: '4px', border: '1px solid #7dd3fc', fontSize: '12px', color: '#0369a1' }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SUBMIT ACTION BUTTONS */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <button type="button" className="secondary-button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" disabled={submitting} style={{ background: '#1769d7' }}>
                    {submitting ? 'Submitting to Meta API...' : '🚀 Submit to Meta for Verification'}
                  </button>
                </div>
              </form>

              {/* RIGHT COLUMN: REAL-TIME 100% RESPONSIVE WHATSAPP MOBILE PHONE SIMULATOR PREVIEW */}
              <div style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <Smartphone size={15} color="#075e54" /> WHATSAPP MOBILE CHAT PREVIEW
                </div>

                {/* SMARTPHONE FRAME CONTAINER */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    height: '490px',
                    background: '#111827',
                    borderRadius: '32px',
                    padding: '10px 8px',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '0 auto',
                  }}
                >
                  {/* PHONE TOP NOTCH / SPEAKER BAR */}
                  <div style={{ width: '80px', height: '12px', background: '#000000', borderRadius: '10px', margin: '0 auto 6px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1f2937' }} />
                  </div>

                  {/* WHATSAPP APP INTERFACE */}
                  <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#efeae2', backgroundImage: 'radial-gradient(#cbd5e1 0.75px, transparent 0.75px)', backgroundSize: '12px 12px' }}>
                    {/* WHATSAPP TOP APP BAR (#075E54) */}
                    <div style={{ background: '#075e54', color: '#ffffff', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                        🏥
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Krishna Hospitals <span style={{ color: '#38bdf8', fontSize: '10px' }}>✓</span>
                        </div>
                        <div style={{ fontSize: '9px', color: '#a7f3d0' }}>Official Business Account</div>
                      </div>
                    </div>

                    {/* CHAT CHRONOLOGY WINDOW */}
                    <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* DATE BADGE */}
                      <div style={{ textAlign: 'center', margin: '2px 0' }}>
                        <span style={{ background: 'rgba(255,255,255,0.85)', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                          TODAY
                        </span>
                      </div>

                      {/* INBOUND WHATSAPP TEMPLATE MESSAGE BUBBLE */}
                      <div
                        style={{
                          alignSelf: 'flex-start',
                          maxWidth: '96%',
                          background: '#ffffff',
                          borderRadius: '0 10px 10px 10px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          padding: '9px 10px',
                          position: 'relative',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {/* HEADER TEXT PREVIEW */}
                        {tplHeaderType === 'TEXT' && tplHeaderContent && (
                          <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '11px', marginBottom: '4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px' }}>
                            {tplHeaderContent}
                          </div>
                        )}

                        {/* LIVE RENDERED BODY TEXT WITH DYNAMIC VARIABLE HIGHLIGHTS */}
                        <div
                          style={{ fontSize: '11px', color: '#1e293b', lineHeight: '1.45', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                          dangerouslySetInnerHTML={{ __html: getRenderedPreviewHTML() }}
                        />

                        {/* FOOTER NOTE PREVIEW */}
                        {tplFooterText && (
                          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '6px', paddingTop: '3px', borderTop: '1px dashed #e2e8f0' }}>
                            {tplFooterText}
                          </div>
                        )}

                        {/* TIMESTAMP & DOUBLE CHECKMARK */}
                        <div style={{ textAlign: 'right', fontSize: '8px', color: '#94a3b8', marginTop: '3px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px' }}>
                          <span>10:42 AM</span>
                          <CheckCheck size={12} color="#34d399" />
                        </div>
                      </div>

                      {/* QUICK REPLY & CTA BUTTONS PREVIEW INSIDE CHAT */}
                      {tplButtons.filter((b) => b.text && b.text.trim().length > 0).length > 0 && (
                        <div style={{ display: 'grid', gap: '5px', maxWidth: '96%', alignSelf: 'flex-start' }}>
                          {tplButtons
                            .filter((b) => b.text && b.text.trim().length > 0)
                            .map((btn, idx) => {
                              const bType = btn.type || 'QUICK_REPLY';
                              const icon = bType === 'PHONE_NUMBER' ? '📞' : bType === 'URL' ? '🌐' : '💬';
                              const subtitle = bType === 'PHONE_NUMBER' ? (btn.phone_number || '') : bType === 'URL' ? (btn.url || '') : '';

                              return (
                                <a
                                  key={idx}
                                  href={bType === 'PHONE_NUMBER' ? `tel:${btn.phone_number || ''}` : bType === 'URL' ? (btn.url || '#') : undefined}
                                  target={bType === 'URL' ? '_blank' : undefined}
                                  rel="noreferrer"
                                  style={{
                                    background: '#ffffff',
                                    color: bType === 'PHONE_NUMBER' ? '#c2410c' : bType === 'URL' ? '#0369a1' : '#0284c7',
                                    padding: '7px 10px',
                                    borderRadius: '6px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    border: '1px solid #e0f2fe',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px',
                                    wordBreak: 'break-word',
                                    textDecoration: 'none',
                                    cursor: bType !== 'QUICK_REPLY' ? 'pointer' : 'default',
                                  }}
                                >
                                  <div>
                                    <span>{icon}</span> {btn.text}
                                  </div>
                                  {subtitle && (
                                    <span style={{ fontSize: '9px', fontWeight: '500', opacity: 0.85 }}>
                                      {subtitle}
                                    </span>
                                  )}
                                </a>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PHONE BOTTOM INDICATOR BAR */}
                  <div style={{ width: '80px', height: '3px', background: '#374151', borderRadius: '4px', margin: '6px auto 0 auto' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatsAppTemplatesPage;
