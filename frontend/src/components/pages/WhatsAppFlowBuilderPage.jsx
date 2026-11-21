import React, { useState, useEffect, useRef } from 'react';
import {
  Workflow,
  Plus,
  Save,
  Zap,
  Bot,
  UserCheck,
  Send,
  Sparkles,
  Building2,
  RefreshCw,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Layers,
  HelpCircle,
  FileText,
  Copy,
  ChevronRight,
  Move,
  ArrowLeft,
  MessageSquare,
  Wand2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

export function WhatsAppFlowBuilderPage({ notify, effectiveBranch = 'All' }) {
  const [flows, setFlows] = useState([]);
  const [activeFlowId, setActiveFlowId] = useState(null);
  const [flowTitle, setFlowTitle] = useState('Krishna Hospitals Customer Flow');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // View mode: 'list' (flow list) vs 'canvas' (digitalmbg visual graph canvas)
  const [viewMode, setViewMode] = useState('list');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Modal States
  const [showAddFlowModal, setShowAddFlowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  const [metaTemplates, setMetaTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [savingFlow, setSavingFlow] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    fetchFlows();
    fetchMetaTemplates();
  }, [effectiveBranch]);

  const fetchFlows = () => {
    fetch(`/api/v1/marketing/flows?branch=${encodeURIComponent(effectiveBranch)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setFlows(data.data);
          const current = data.data.find((f) => f.isDefault) || data.data[0];
          setActiveFlowId(current._id);
          setFlowTitle(current.flowTitle || 'Krishna Hospitals Flow');
          setNodes(current.nodes || []);
          setEdges(current.edges || []);
        }
      })
      .catch((err) => console.warn('Could not fetch flows:', err.message));
  };

  const fetchMetaTemplates = () => {
    setLoadingTemplates(true);
    fetch('/api/v1/marketing/templates/sync')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setMetaTemplates(data.data);
        }
      })
      .catch((err) => console.warn('Could not sync Meta templates:', err.message))
      .finally(() => setLoadingTemplates(false));
  };

  const handleOpenFlowCanvas = (flowObj) => {
    setActiveFlowId(flowObj._id);
    setFlowTitle(flowObj.flowTitle || 'Krishna Hospitals Flow');
    setNodes(flowObj.nodes || []);
    setEdges(flowObj.edges || []);
    setViewMode('canvas');
  };

  // MBG Tree Layout Auto Arranger: Positions Trigger on Left, Menu in Center, Stack of Child Reply Nodes on Right
  const handleAutoTreeLayout = () => {
    setNodes((prevNodes) => {
      const trigger = prevNodes.find((n) => n.type === 'trigger' || n.type === 'start') || prevNodes[0];
      const menus = prevNodes.filter((n) => n.type === 'interactive_menu' || n.type === 'template');
      const replies = prevNodes.filter((n) => n.id !== trigger?.id && !menus.some((m) => m.id === n.id));

      const updated = prevNodes.map((node) => {
        if (node.id === trigger?.id) {
          return { ...node, position: { x: 40, y: 160 } };
        }
        if (menus.some((m) => m.id === node.id)) {
          return { ...node, position: { x: 380, y: 100 } };
        }
        // Stack reply nodes vertically on the right
        const replyIndex = replies.findIndex((r) => r.id === node.id);
        const yPos = 40 + Math.max(0, replyIndex) * 140;
        return { ...node, position: { x: 740, y: yPos } };
      });

      return updated;
    });

    notify && notify('Tree layout auto-arranged in DigitalMBG workflow view!');
  };

  const handleCreateNewFlowSubmit = (e) => {
    e.preventDefault();
    if (!newFlowName.trim()) {
      notify && notify('Please enter a flow name');
      return;
    }

    const title = newFlowName.trim();
    const initialNodes = [
      {
        id: 'node-1',
        type: 'trigger',
        position: { x: 50, y: 160 },
        data: {
          label: '🚀 Start Trigger',
          keywords: ['hi', 'hello', 'opd', 'book', 'start', 'menu'],
          description: 'Triggers when patient sends a greeting',
        },
      },
    ];

    const initialEdges = [];

    setActiveFlowId(null);
    setFlowTitle(title);
    setNodes(initialNodes);
    setEdges(initialEdges);
    setShowAddFlowModal(false);
    setNewFlowName('');
    setViewMode('canvas');
    notify && notify(`Created new flow "${title}". Click "+" to select Meta templates & build button replies!`);
  };

  const handleSaveFlow = async () => {
    if (!flowTitle.trim()) {
      notify && notify('Please enter a flow title');
      return;
    }
    setSavingFlow(true);
    try {
      const res = await fetch('/api/v1/marketing/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: activeFlowId,
          flowTitle: flowTitle.trim(),
          nodes,
          edges,
          branch: effectiveBranch,
          isDefault: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify && notify(`Visual flow "${flowTitle}" saved and set active!`);
        fetchFlows();
      } else {
        notify && notify(data.message || 'Failed to save flow');
      }
    } catch (err) {
      notify && notify('Error saving flow');
    } finally {
      setSavingFlow(false);
    }
  };

  const handleActivateFlow = async (id) => {
    try {
      const res = await fetch(`/api/v1/marketing/flows/${id}/activate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        notify && notify('Flow set as primary active WhatsApp responder!');
        fetchFlows();
      }
    } catch (err) {
      notify && notify('Error activating flow');
    }
  };

  const handleDeleteFlow = async (id) => {
    try {
      const res = await fetch(`/api/v1/marketing/flows/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        notify && notify('Flow deleted successfully');
        fetchFlows();
      }
    } catch (err) {
      notify && notify('Error deleting flow');
    }
  };

  const handleAddNode = (type, templateData = null) => {
    const newId = `node-${Date.now()}`;
    const position = { x: 740, y: 40 + nodes.length * 120 };

    let newNode = {
      id: newId,
      type,
      position,
      data: { label: `New ${type} Node` },
    };

    if (type === 'trigger') {
      newNode.data = {
        label: '🚀 Start Keyword Trigger',
        keywords: ['hi', 'hello', 'opd', 'book', 'menu'],
        description: 'Triggers on patient greeting or keyword',
      };
    } else if (type === 'interactive_menu') {
      newNode.data = {
        label: '📜 Interactive Menu / Buttons',
        headerText: 'KRISHNA HOSPITALS MENU 🏥',
        bodyText: 'Please select an option below:',
        buttons: [
          { id: 'btn_1', title: '1. 🏥 OPD Consultation Timings' },
          { id: 'btn_2', title: '2. 💰 Consultation Fees' },
          { id: 'btn_3', title: '3. 🤖 Ask AI Health Assistant' },
          { id: 'btn_4', title: '4. 👨‍💼 Talk to Reception Desk' },
        ],
      };
    } else if (type === 'template' && templateData) {
      const formattedBtns = (templateData.buttons || []).map((b, idx) => {
        const text = typeof b === 'string' ? b : b.text || b.title || `Button ${idx + 1}`;
        return { id: `tpl_btn_${idx}_${Date.now()}`, title: text, text };
      });
      newNode.data = {
        label: `📌 Meta Template: ${templateData.name}`,
        templateName: templateData.name,
        templateLanguage: templateData.language || 'en_US',
        bodyText: templateData.bodyText || 'Meta approved template message',
        status: templateData.status || 'APPROVED',
        buttons: formattedBtns.length > 0 ? formattedBtns : [
          { id: 'btn_book', title: 'Book OPD', text: 'Book OPD' },
          { id: 'btn_staff', title: 'Chat Reception', text: 'Chat Reception' },
        ],
      };
    } else if (type === 'ai_agent') {
      newNode.data = {
        label: '🤖 OpenAI AI Agent (gpt-4o-mini)',
        modelName: 'gpt-4o-mini',
        description: 'Answers unstructured patient inquiries 24/7',
      };
    } else if (type === 'staff_handover') {
      newNode.data = {
        label: '👨‍💼 Reception Staff Handover',
        text: 'Connecting you with Krishna Hospitals reception desk staff...',
        description: 'Routes thread to /inbox',
      };
    } else {
      newNode.data = {
        label: '💬 Text Reply Node',
        bodyText: 'Thank you for reaching out to Krishna Hospitals.',
      };
    }

    setNodes((prev) => [...prev, newNode]);
    setShowAddNodeModal(false);
    notify && notify(`Added node "${newNode.data.label}" to canvas!`);
  };

  const handleConnectButtonToNode = (sourceNodeId, buttonId, buttonTitle, targetNodeId) => {
    setEdges((prev) => {
      const filtered = prev.filter(
        (e) => !(e.source === sourceNodeId && (e.buttonId === buttonId || e.sourceHandle === buttonId))
      );
      if (!targetNodeId) return filtered;

      const newEdge = {
        id: `e-${sourceNodeId}-${buttonId}-${targetNodeId}`,
        source: sourceNodeId,
        sourceHandle: buttonId,
        buttonId: buttonId,
        buttonTitle: buttonTitle,
        target: targetNodeId,
      };
      return [...filtered, newEdge];
    });
    notify && notify(`Button "${buttonTitle}" connected to target reply node!`);
  };

  const handleDeleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
  };

  const handleUpdateNodeData = (id, updatedData) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...updatedData } } : n))
    );
  };

  return (
    <div style={{ padding: '0', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* FLOW BUILDER VIEW MODE: LIST VS DIGITALMBG CANVAS */}
      {viewMode === 'list' ? (
        <div style={{ padding: '16px' }}>
          {/* HEADER BAR WITH TOP RIGHT "+ ADD FLOW" BUTTON */}
          <div className="page-heading" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Workflow size={14} color="#1769d7" /> WhatsApp Automation Suite
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>WhatsApp Visual Flows</h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Select an existing flow to open the interactive canvas or click + Add Flow to design a new chatbot workflow.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '16px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: '700', border: '1px solid #bae6fd' }}>
                <Building2 size={14} /> SCOPE: {effectiveBranch.toUpperCase()}
              </span>

              <button
                className="primary-button"
                onClick={() => setShowAddFlowModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: '#1769d7', padding: '9px 18px', borderRadius: '8px', fontWeight: '700' }}
              >
                <Plus size={16} /> + Add Flow
              </button>
            </div>
          </div>

          {/* FLOWS GRID LIST */}
          {flows.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', padding: '48px 24px', textAlign: 'center' }}>
              <Workflow size={42} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', color: '#1e293b', margin: '0 0 6px 0' }}>No Visual Flows Configured</h3>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                Click "+ Add Flow" on the top right to name your flow and open the visual canvas builder.
              </p>
              <button className="primary-button" onClick={() => setShowAddFlowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Plus size={16} /> + Add Flow Now
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              {flows.map((flow) => {
                const isActive = flow.isDefault || flow.status === 'Active';

                return (
                  <div
                    key={flow._id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: `1.5px solid ${isActive ? '#93c5fd' : '#e2e8f0'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      transition: 'transform 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenFlowCanvas(flow)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ flex: 1, paddingRight: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {flow.branch === 'All' ? 'GLOBAL HOSPITAL FLOW' : `BRANCH: ${flow.branch}`}
                          </span>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>
                            {flow.flowTitle}
                          </h3>
                        </div>

                        {isActive && (
                          <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontSize: '10px', fontWeight: '800', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                            ⭐ Active Default
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {flow.description || 'Interactive WhatsApp flow: Welcome Menu -> Templates -> AI Agent -> Reception Handover'}
                      </p>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#475569', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px' }}>
                        <div><strong>Nodes:</strong> {flow.nodes?.length || 0}</div>
                        <div><strong>Triggers:</strong> {(flow.triggerKeywords || ['hi']).slice(0, 3).join(', ')}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }} onClick={(e) => e.stopPropagation()}>
                      {!isActive && (
                        <button
                          className="secondary-button"
                          onClick={() => handleActivateFlow(flow._id)}
                          style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700' }}
                        >
                          Set Active
                        </button>
                      )}

                      <button
                        className="primary-button"
                        onClick={() => handleOpenFlowCanvas(flow)}
                        style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', background: '#1769d7', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit3 size={13} /> Open Canvas
                      </button>

                      {flows.length > 1 && (
                        <button
                          onClick={() => handleDeleteFlow(flow._id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer' }}
                          title="Delete Flow"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* DIGITALMBG STYLE FULLSCREEN VISUAL GRAPH CANVAS WORKSPACE */
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', background: '#f1f5f9' }}>
          {/* DIGITALMBG STYLE TOP HEADER BAR: < FLOW | [ FLOW TITLE INPUT ] | UNDO | REDO | SAVE */}
          <div
            style={{
              height: '56px',
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              zIndex: 30,
            }}
          >
            {/* LEFT HEADER: < FLOW & FLOW TITLE INPUT BOX */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} /> Flow
              </button>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={flowTitle}
                  onChange={(e) => setFlowTitle(e.target.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#0f172a',
                    minWidth: '260px',
                    background: '#f8fafc',
                  }}
                />
              </div>
            </div>

            {/* RIGHT HEADER: UNDO, REDO, SAVE (BLUE BUTTON) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => notify && notify('Undo action')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} /> Undo
              </button>

              <button
                onClick={() => notify && notify('Redo action')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'not-allowed',
                }}
                disabled
              >
                <RotateCw size={14} /> Redo
              </button>

              <button
                className="primary-button"
                onClick={handleSaveFlow}
                disabled={savingFlow}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 22px',
                  borderRadius: '6px',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(29,78,216,0.3)',
                  cursor: 'pointer',
                }}
              >
                <Save size={15} /> {savingFlow ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* MAIN GRAPH CANVAS CONTAINER */}
          <div
            ref={canvasRef}
            style={{
              flex: 1,
              position: 'relative',
              background: '#f8fafc',
              backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
              backgroundSize: '24px 24px',
              overflow: 'auto',
              transform: `scale(${zoomLevel})`,
              transformOrigin: '0 0',
              transition: 'transform 0.15s ease',
            }}
          >
            {/* SVG BEZIER CONNECTOR PATHS RADIATING FROM EACH BUTTON ITEM TO CHILD NODES */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '3000px', height: '3000px', pointerEvents: 'none', zIndex: 1 }}>
              {edges.map((e) => {
                const srcNode = nodes.find((n) => n.id === e.source);
                const tgtNode = nodes.find((n) => n.id === e.target);
                if (!srcNode || !tgtNode) return null;

                const x1 = (srcNode.position?.x || 100) + 290;
                const y1 = (srcNode.position?.y || 100) + (e.buttonId ? 140 : 40);
                const x2 = (tgtNode.position?.x || 300);
                const y2 = (tgtNode.position?.y || 100) + 40;

                return (
                  <g key={e.id}>
                    <path
                      d={`M ${x1} ${y1} C ${x1 + 100} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}`}
                      stroke="#1d4ed8"
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray={e.buttonId ? 'none' : '6,6'}
                    />
                    <circle cx={x2} cy={y2} r="5" fill="#1d4ed8" />
                  </g>
                );
              })}
            </svg>

            {/* CANVAS RENDERED NODE CARDS (DIGITALMBG STYLE CARDS WITH BUTTON SOCKET HANDLES) */}
            <div style={{ position: 'relative', zIndex: 2, padding: '40px' }}>
              {nodes.map((node) => {
                const isTrigger = node.type === 'trigger' || node.type === 'start';
                const isMenu = node.type === 'interactive_menu';
                const isAi = node.type === 'ai_agent';
                const isStaff = node.type === 'staff_handover';
                const isTpl = node.type === 'template';

                let headerBg = '#15803d'; // Green by default
                let headerTitle = 'Text Message';

                if (isTrigger) { headerBg = '#0284c7'; headerTitle = 'Action Message / Trigger'; }
                else if (isMenu) { headerBg = '#059669'; headerTitle = 'List Message'; }
                else if (isAi) { headerBg = '#7e22ce'; headerTitle = 'AI Message'; }
                else if (isStaff) { headerBg = '#0d9488'; headerTitle = 'Handover Message'; }
                else if (isTpl) { headerBg = '#1d4ed8'; headerTitle = 'Meta Template Message'; }

                const buttonList = node.data?.buttons || [];

                return (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute',
                      left: `${node.position?.x || 100}px`,
                      top: `${node.position?.y || 100}px`,
                      width: '290px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* DIGITALMBG STYLE CARD HEADER WITH CLOSE / SETTINGS CONTROLS */}
                    <div
                      style={{
                        background: headerBg,
                        color: '#ffffff',
                        padding: '8px 12px',
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isMenu ? '📜' : isAi ? '🤖' : isStaff ? '👨‍💼' : isTrigger ? '🚀' : '💬'} {headerTitle}
                      </span>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          onClick={() => { setSelectedNode(node); setShowNodeModal(true); }}
                          style={{ background: 'none', border: 'none', color: '#ffffff', padding: '2px', cursor: 'pointer' }}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          style={{ background: 'none', border: 'none', color: '#ffffff', padding: '2px', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* NODE CONTENT PREVIEW & BUTTON-SPECIFIC OUTGOING HANDLES */}
                    <div style={{ padding: '12px', fontSize: '11px', color: '#475569' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px', fontSize: '12px' }}>
                        {node.data?.label || node.type}
                      </div>

                      {isTrigger && (
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>
                            Triggers on patient greeting or keyword:
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(node.data?.keywords || ['hi', 'hello']).map((k) => (
                              <span key={k} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                "{k}"
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(isMenu || isTpl) && (
                        <div>
                          <div style={{ marginBottom: '8px', fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                            {node.data?.bodyText || 'Please select an option below:'}
                          </div>

                          {/* LIST OF BUTTON OPTIONS WITH CONNECTOR SOCKET DOT (●) ON RIGHT */}
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {buttonList.map((btn, idx) => {
                              const btnId = btn.id || `btn_${idx}`;
                              const btnTitle = typeof btn === 'string' ? btn : btn.title || btn.text || `Option ${idx + 1}`;
                              const existingEdge = edges.find((e) => e.source === node.id && (e.buttonId === btnId || e.sourceHandle === btnId));
                              const connectedTargetNodeId = existingEdge?.target || '';

                              return (
                                <div
                                  key={btnId}
                                  style={{
                                    padding: '8px 10px',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    position: 'relative',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '11px' }}>
                                      📱 {btnTitle}
                                    </span>

                                    {/* OUTGOING CONNECTOR SOCKET DOT (●) */}
                                    <span
                                      style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: connectedTargetNodeId ? '#1d4ed8' : '#94a3b8',
                                        display: 'inline-block',
                                        boxShadow: connectedTargetNodeId ? '0 0 6px #1d4ed8' : 'none',
                                      }}
                                      title="Output connection handle"
                                    />
                                  </div>

                                  {/* TARGET NODE DROPDOWN SELECTOR */}
                                  <select
                                    value={connectedTargetNodeId}
                                    onChange={(e) => handleConnectButtonToNode(node.id, btnId, btnTitle, e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '4px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid #93c5fd',
                                      background: '#ffffff',
                                      color: '#1d4ed8',
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <option value="">-- Connect Reply Node --</option>
                                    {nodes
                                      .filter((n) => n.id !== node.id && n.type !== 'trigger')
                                      .map((target) => (
                                        <option key={target.id} value={target.id}>
                                          → Send: {target.data?.label || target.type}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isAi && (
                        <div>
                          <div style={{ fontWeight: '700', color: '#7e22ce' }}>Model: {node.data?.modelName || 'gpt-4o-mini'}</div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b' }}>
                            Answers OPD, doctor list, and medical inquiries 24/7.
                          </p>
                        </div>
                      )}

                      {isStaff && (
                        <div>
                          <div style={{ fontWeight: '700', color: '#0d9488' }}>Live Inbox Routing (/inbox)</div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b' }}>
                            {node.data?.text || 'Transfers thread to reception desk'}
                          </p>
                        </div>
                      )}

                      {!isTrigger && !isMenu && !isAi && !isStaff && !isTpl && (
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{node.data?.bodyText}</div>
                      )}
                    </div>

                    {/* BOTTOM CONNECTOR BUTTON */}
                    <div style={{ padding: '6px 12px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>+ Continue</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FLOATING BOTTOM DOCK CONTROLS (DIGITALMBG STYLE FLOATING PILL TOOLBAR) */}
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#3b82f6',
              borderRadius: '30px',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              zIndex: 40,
            }}
          >
            <button
              onClick={handleAutoTreeLayout}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700' }}
              title="Auto Tree Layout"
            >
              <Wand2 size={18} /> Layout
            </button>

            <button
              onClick={() => setZoomLevel(1)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
              title="Fit View"
            >
              <Maximize2 size={18} />
            </button>

            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>

            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>

            {/* ADD NODE BLUE BUTTON (+) */}
            <button
              onClick={() => setShowAddNodeModal(true)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#1d4ed8',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
              title="Add Node / Select Template"
            >
              <Plus size={22} />
            </button>
          </div>

          {/* BOTTOM RIGHT MINIMAP OVERLAY PREVIEW */}
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '160px',
              height: '100px',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(4px)',
              borderRadius: '10px',
              border: '2px solid #3b82f6',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
              padding: '8px',
              pointerEvents: 'none',
              zIndex: 35,
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#3b82f6' }}>TREE MINIMAP</div>
            <div style={{ position: 'relative', width: '100%', height: '65px', background: '#f8fafc', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
              <div style={{ position: 'absolute', left: '10px', top: '25px', width: '14px', height: '14px', borderRadius: '3px', background: '#0284c7' }} />
              <div style={{ position: 'absolute', left: '45px', top: '15px', width: '18px', height: '35px', borderRadius: '3px', background: '#059669' }} />
              <div style={{ position: 'absolute', left: '85px', top: '5px', width: '14px', height: '10px', borderRadius: '2px', background: '#15803d' }} />
              <div style={{ position: 'absolute', left: '85px', top: '25px', width: '14px', height: '10px', borderRadius: '2px', background: '#7e22ce' }} />
              <div style={{ position: 'absolute', left: '85px', top: '45px', width: '14px', height: '10px', borderRadius: '2px', background: '#0d9488' }} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: + ADD FLOW MODAL (PROMPTS FOR NEW FLOW NAME) */}
      {showAddFlowModal && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal" style={{ width: '440px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Create New WhatsApp Visual Flow</h2>
              <button onClick={() => setShowAddFlowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateNewFlowSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  ENTER FLOW NAME *
                </label>
                <input
                  type="text"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="e.g. Customer Flow (Copy)"
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setShowAddFlowModal(false)}>Cancel</button>
                <button type="submit" className="primary-button" style={{ background: '#1d4ed8' }}>
                  Create & Open Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: + ADD NODE / SELECT TEMPLATE MODAL */}
      {showAddNodeModal && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal" style={{ width: '540px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Select Node Type or Approved Meta Template</h2>
              <button onClick={() => setShowAddNodeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>STANDARD FLOW NODES</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => handleAddNode('trigger')}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f0f9ff', textAlign: 'left', cursor: 'pointer' }}
                >
                  <strong style={{ fontSize: '12px', color: '#0369a1', display: 'block' }}>🚀 Start Trigger</strong>
                  <span style={{ fontSize: '10px', color: '#0284c7' }}>Triggers on greetings ("hi", "opd")</span>
                </button>

                <button
                  onClick={() => handleAddNode('interactive_menu')}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #fef3c7', background: '#fffbeb', textAlign: 'left', cursor: 'pointer' }}
                >
                  <strong style={{ fontSize: '12px', color: '#92400e', display: 'block' }}>📜 Interactive List Menu</strong>
                  <span style={{ fontSize: '10px', color: '#b45309' }}>Multiple reply buttons</span>
                </button>

                <button
                  onClick={() => handleAddNode('text')}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', textAlign: 'left', cursor: 'pointer' }}
                >
                  <strong style={{ fontSize: '12px', color: '#374151', display: 'block' }}>💬 Custom Text Reply</strong>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>Static message text</span>
                </button>

                <button
                  onClick={() => handleAddNode('ai_agent')}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', background: '#faf5ff', textAlign: 'left', cursor: 'pointer' }}
                >
                  <strong style={{ fontSize: '12px', color: '#6b21a8', display: 'block' }}>🤖 OpenAI AI Agent</strong>
                  <span style={{ fontSize: '10px', color: '#7e22ce' }}>Dynamic gpt-4o-mini replies</span>
                </button>

                <button
                  onClick={() => handleAddNode('staff_handover')}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', background: '#f0fdf4', textAlign: 'left', cursor: 'pointer' }}
                >
                  <strong style={{ fontSize: '12px', color: '#166534', display: 'block' }}>👨‍💼 Staff Route</strong>
                  <span style={{ fontSize: '10px', color: '#15803d' }}>Transfers to reception /inbox</span>
                </button>
              </div>

              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', marginTop: '10px' }}>SELECT APPROVED META TEMPLATE</div>

              {metaTemplates.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#94a3b8', padding: '10px', textAlign: 'center' }}>No templates available yet</div>
              ) : (
                <div style={{ display: 'grid', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {metaTemplates.map((tpl) => (
                    <button
                      key={tpl._id || tpl.name}
                      onClick={() => handleAddNode('template', tpl)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '12px' }}>📌 {tpl.name}</strong>
                        <span style={{ fontSize: '10px', display: 'block', color: '#3b82f6' }}>{tpl.bodyText?.slice(0, 45)}...</span>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
                        ✓ {tpl.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NODE EDIT INSPECTOR MODAL */}
      {showNodeModal && selectedNode && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal" style={{ width: '500px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Edit Node Properties</h2>
              <button onClick={() => setShowNodeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>NODE TITLE / LABEL</label>
                <input
                  type="text"
                  value={selectedNode.data?.label || ''}
                  onChange={(e) => handleUpdateNodeData(selectedNode.id, { label: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              {selectedNode.type === 'trigger' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>TRIGGER KEYWORDS (Comma separated)</label>
                  <input
                    type="text"
                    value={(selectedNode.data?.keywords || []).join(', ')}
                    onChange={(e) => handleUpdateNodeData(selectedNode.id, { keywords: e.target.value.split(',').map((k) => k.trim()) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              )}

              {(selectedNode.type === 'text' || selectedNode.type === 'staff_handover') && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>RESPONSE MESSAGE TEXT</label>
                  <textarea
                    rows={3}
                    value={selectedNode.data?.bodyText || selectedNode.data?.text || ''}
                    onChange={(e) => handleUpdateNodeData(selectedNode.id, { bodyText: e.target.value, text: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'inherit' }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="primary-button" onClick={() => setShowNodeModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatsAppFlowBuilderPage;
