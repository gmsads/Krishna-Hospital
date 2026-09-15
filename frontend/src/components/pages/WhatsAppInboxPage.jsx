import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Bot,
  UserCheck,
  RefreshCw,
  PhoneCall,
  Clock,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  Building2,
  Circle,
  ArrowLeft,
} from 'lucide-react';

export function WhatsAppInboxPage({ notify, effectiveBranch = 'All' }) {
  const [threads, setThreads] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef(null);

  // Monitor window resize for 100% mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch threads on mount and poll every 5 seconds for live updates
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 5000);
    return () => clearInterval(interval);
  }, [effectiveBranch]);

  // Fetch messages when selected phone changes
  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone);
    }
  }, [selectedPhone]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchThreads = () => {
    setLoadingThreads(true);
    return fetch(`http://localhost:5000/api/v1/marketing/conversations?branch=${encodeURIComponent(effectiveBranch)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setThreads(data.data);
          // If no phone selected yet and threads exist, select first thread on desktop
          if (!selectedPhone && data.data.length > 0 && !isMobile) {
            setSelectedPhone(data.data[0].phone);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch WhatsApp threads:', err.message))
      .finally(() => setLoadingThreads(false));
  };

  const fetchMessages = (phone) => {
    setLoadingMessages(true);
    return fetch(`http://localhost:5000/api/v1/marketing/conversations/${encodeURIComponent(phone)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setMessages(data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch conversation messages:', err.message))
      .finally(() => setLoadingMessages(false));
  };

  const handleRefreshAll = () => {
    fetchThreads();
    if (selectedPhone) {
      fetchMessages(selectedPhone);
    }
  };

  const handleSelectThread = (phone) => {
    setSelectedPhone(phone);
    setMobileShowChat(true);
    fetchMessages(phone);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedPhone || !replyText.trim()) return;

    setSendingReply(true);
    const textToSend = replyText.trim();
    setReplyText('');

    try {
      const res = await fetch('http://localhost:5000/api/v1/marketing/reply-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedPhone,
          messageText: textToSend,
          staffName: 'Reception Staff',
          branch: effectiveBranch,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify && notify(`Message delivered to ${selectedPhone} on WhatsApp!`);
        fetchMessages(selectedPhone);
        fetchThreads();
      } else {
        notify && notify(data.message || 'Failed to send WhatsApp reply');
      }
    } catch (err) {
      notify && notify('Network error sending WhatsApp reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleMode = async (phone, currentMode) => {
    const newMode = currentMode === 'human' ? 'ai' : 'human';
    try {
      const res = await fetch('http://localhost:5000/api/v1/marketing/conversations/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, mode: newMode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setThreads((prev) =>
          prev.map((t) => (t.phone === phone ? { ...t, mode: newMode } : t))
        );
        notify && notify(`Chat mode set to ${newMode === 'human' ? '👨‍💼 HUMAN MODE (Staff Only)' : '🤖 AI AGENT MODE (Auto-Reply)'}`);
      }
    } catch (err) {
      console.warn('Could not toggle chat mode:', err.message);
    }
  };

  const selectedThread = threads.find((t) => t.phone === selectedPhone);

  const filteredThreads = threads.filter(
    (t) =>
      (t.patientName && t.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.phone && t.phone.includes(searchQuery))
  );

  return (
    <>
      <div className="page-heading" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <div className="eyebrow">Live Patient Communication</div>
          <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)', margin: '2px 0 4px 0' }}>Official WhatsApp Web Live Inbox</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Real-time WhatsApp Web chat interface with 24/7 OpenAI Auto-Responder integration.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '16px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: '700', border: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>
            <Building2 size={14} /> SCOPE: {effectiveBranch.toUpperCase()}
          </span>
          <button className="secondary-button" onClick={handleRefreshAll} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', whiteSpace: 'nowrap' }}>
            <RefreshCw size={14} className={loadingThreads || loadingMessages ? 'spin' : ''} /> Refresh Inbox
          </button>
        </div>
      </div>

      {/* DUAL-PANE WHATSAPP WEB STYLE CHAT INTERFACE - RESPONSIVE & NO OVERFLOW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px, 320px) minmax(0, 1fr)',
          gap: '0',
          height: isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 220px)',
          minHeight: '450px',
          maxHeight: '750px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT PANEL: CONVERSATIONS THREADS LIST */}
        {(!isMobile || !mobileShowChat) && (
          <div style={{ borderRight: isMobile ? 'none' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc', width: '100%', height: '100%', minWidth: 0, overflow: 'hidden' }}>
            {/* Search Header */}
            <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient name or phone..."
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    background: '#f1f5f9',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Threads Scroll List */}
            <div style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
              {filteredThreads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: '12px' }}>
                  No active patient WhatsApp chats. When a patient messages on WhatsApp, their chat appears here live!
                </div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = t.phone === selectedPhone;
                  return (
                    <div
                      key={t.phone}
                      onClick={() => handleSelectThread(t.phone)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : 'transparent',
                        borderLeft: isSelected ? '4px solid #1769d7' : '4px solid transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Circle Avatar */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#1769d7',
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: '700',
                          fontSize: '14px',
                          flexShrink: 0,
                        }}
                      >
                        {(t.patientName || 'P').charAt(0).toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.patientName || 'Patient'}
                          </strong>
                          <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0, marginLeft: '6px' }}>
                            {t.lastMessageTime ? new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.lastMessage || 'WhatsApp message'}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: '800',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              background: t.mode === 'human' ? '#fff7ed' : '#f0fdf4',
                              color: t.mode === 'human' ? '#c2410c' : '#15803d',
                              border: t.mode === 'human' ? '1px solid #ffedd5' : '1px solid #bbf7d0',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.mode === 'human' ? '👨‍💼 Human Mode' : '🤖 AI Mode'}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.phone}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* RIGHT MAIN PANEL: LIVE CHAT WINDOW */}
        {(!isMobile || mobileShowChat) && (
          <div style={{ display: 'flex', flexDirection: 'column', background: '#efeae2', width: '100%', height: '100%', minWidth: 0, overflow: 'hidden' }}>
            {!selectedPhone ? (
              <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '32px', color: '#64748b' }}>
                <div>
                  <MessageSquare size={48} color="#25D366" style={{ marginBottom: '12px' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Select a Patient Conversation</h3>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px' }}>Choose a patient thread from the left menu to view live WhatsApp chat and reply.</p>
                </div>
              </div>
            ) : (
              <>
                {/* WhatsApp Chat Room Header */}
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#075e54',
                    color: '#ffffff',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0,
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
                    {isMobile && (
                      <button
                        onClick={() => setMobileShowChat(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ffffff',
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Back to Conversations"
                      >
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        color: '#075e54',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: '800',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {(selectedThread?.patientName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong style={{ fontSize: '14px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
                        {selectedThread?.patientName || 'Patient'}
                      </strong>
                      <span style={{ fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Circle size={8} fill="#25D366" color="#25D366" /> {selectedPhone} • Online on WhatsApp
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    {/* Interactive AI Agent vs Human Staff Mode Selector */}
                    <button
                      type="button"
                      onClick={() => handleToggleMode(selectedPhone, selectedThread?.mode || 'ai')}
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: (selectedThread?.mode || 'ai') === 'human' ? '#f59e0b' : '#25D366',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                      title="Click to toggle between AI Auto-Reply and Human Staff Mode"
                    >
                      {(selectedThread?.mode || 'ai') === 'human' ? (
                        <>
                          <User size={13} color="#fff" /> Mode: 👨‍💼 HUMAN (Staff Only)
                        </>
                      ) : (
                        <>
                          <Bot size={13} color="#fff" /> Mode: 🤖 AI AGENT (Auto-Reply)
                        </>
                      )}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => fetchMessages(selectedPhone)}
                      style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={12} className={loadingMessages ? 'spin' : ''} /> Sync
                    </button>
                  </div>
                </div>

                {/* Chat Messages Body Scroll Area */}
                <div
                  style={{
                    flex: '1 1 auto',
                    overflowY: 'auto',
                    padding: isMobile ? '12px 14px' : '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: '#efeae2',
                    minHeight: 0,
                  }}
                >
                  {loadingMessages && messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', margin: 'auto' }}>Loading chat history...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', margin: 'auto' }}>No previous messages for this patient.</div>
                  ) : (
                    messages.map((m) => {
                      const isInbound = m.direction === 'inbound';
                      return (
                        <div
                          key={m._id}
                          style={{
                            alignSelf: isInbound ? 'flex-start' : 'flex-end',
                            maxWidth: isMobile ? '88%' : '80%',
                            background: isInbound ? '#ffffff' : '#dcf8c6',
                            borderRadius: isInbound ? '0 12px 12px 12px' : '12px 0 12px 12px',
                            padding: '10px 14px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                            fontSize: '13px',
                            color: '#111b21',
                            lineHeight: '1.45',
                            position: 'relative',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {/* Sender Label */}
                          <div style={{ fontSize: '10px', fontWeight: '700', color: isInbound ? '#128c7e' : '#075e54', marginBottom: '4px' }}>
                            {isInbound ? `👤 ${m.senderName || 'Patient'}` : m.senderType === 'ai' ? '🤖 Krishna Hospitals AI (gpt-4o-mini)' : '👨‍💼 Staff Member'}
                          </div>

                          {/* Message Text */}
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.messageText}</div>

                          {/* Time & Delivery Status */}
                          <div
                            style={{
                              textAlign: 'right',
                              fontSize: '10px',
                              color: '#667781',
                              marginTop: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '3px',
                            }}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {!isInbound && <CheckCheck size={14} color="#53bdeb" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Message Reply Footer Form */}
                <form
                  onSubmit={handleSendReply}
                  style={{
                    padding: isMobile ? '8px 10px' : '10px 14px',
                    background: '#f0f0f0',
                    borderTop: '1px solid #d1c7bd',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexShrink: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Type a reply to ${selectedThread?.patientName || 'patient'}...`}
                    disabled={sendingReply}
                    style={{
                      flex: 1,
                      padding: isMobile ? '10px 14px' : '12px 16px',
                      borderRadius: '24px',
                      border: '1px solid #cccccc',
                      fontSize: '13px',
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  />

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={sendingReply || !replyText.trim()}
                    style={{
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      padding: 0,
                      justifyContent: 'center',
                      background: '#128c7e',
                      borderColor: '#128c7e',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default WhatsAppInboxPage;
