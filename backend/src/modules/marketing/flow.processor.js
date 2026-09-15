import { WhatsAppFlow } from './flow.model.js';
import { generateHospitalAIReply } from './whatsapp.ai.js';
import { sendWithRetry } from './whatsapp.retry.js';
import { WhatsAppMessageLog } from './chat.model.js';
import { OPRecord } from '../op-records/op-record.model.js';

export class WhatsAppFlowProcessor {
  constructor(adapter) {
    this.adapter = adapter;
  }

  async processInboundFlow(to, incomingText, buttonPayload = null) {
    try {
      // Find active hospital flow for patient's branch
      let patientBranch = 'All';
      try {
        const cleanDigits = String(to).replace(/\D/g, '').slice(-10);
        const opRec = await OPRecord.findOne({ phone: new RegExp(cleanDigits + '$') }).select('branch');
        if (opRec && opRec.branch) patientBranch = opRec.branch;
      } catch (err) {}

      const activeFlow = await WhatsAppFlow.findOne({
        status: 'Active',
        $or: [{ branch: new RegExp(patientBranch, 'i') }, { branch: 'All' }, { isDefault: true }],
      }).sort({ isDefault: -1, updatedAt: -1 });

      if (!activeFlow || !activeFlow.nodes || activeFlow.nodes.length === 0) {
        return { handled: false };
      }

      const nodes = activeFlow.nodes;
      const edges = activeFlow.edges || [];
      const textClean = (incomingText || '').trim().toLowerCase();
      const payloadClean = (buttonPayload || '').trim().toLowerCase();

      // 1. Check if button payload or text matches a specific button connected to a target node
      let buttonEdgeTargetNode = null;
      if (payloadClean || textClean) {
        for (const edge of edges) {
          if (
            (edge.buttonId && (edge.buttonId.toLowerCase() === payloadClean || edge.buttonId.toLowerCase() === textClean)) ||
            (edge.sourceHandle && (edge.sourceHandle.toLowerCase() === payloadClean || edge.sourceHandle.toLowerCase() === textClean)) ||
            (edge.buttonTitle && (edge.buttonTitle.toLowerCase() === payloadClean || edge.buttonTitle.toLowerCase() === textClean))
          ) {
            buttonEdgeTargetNode = nodes.find((n) => n.id === edge.target);
            if (buttonEdgeTargetNode) break;
          }
        }
      }

      if (buttonEdgeTargetNode) {
        return await this.executeNode(buttonEdgeTargetNode, nodes, edges, to, patientBranch, incomingText);
      }

      // 2. Match button payload or list choice ID against node buttons
      let matchedNode = null;
      if (payloadClean) {
        matchedNode = nodes.find((n) => n.id === buttonPayload || (n.data && n.data.buttonId === buttonPayload));
      }

      // 3. Match node menu options or button choices
      if (!matchedNode && (payloadClean || textClean)) {
        matchedNode = nodes.find((n) =>
          n.data && n.data.buttons && n.data.buttons.some((b) => {
            const bId = String(b.id || '').toLowerCase();
            const bTitle = String(b.title || b.text || '').toLowerCase();
            return bId === payloadClean || bTitle === payloadClean || bId === textClean || bTitle === textClean;
          })
        );
      }

      // 4. Match trigger node keywords or start node
      if (!matchedNode) {
        matchedNode = nodes.find((n) =>
          n.type === 'trigger' && n.data && n.data.keywords && n.data.keywords.some((k) => textClean.includes(k.toLowerCase()))
        );
      }

      // 5. Default to Start / Trigger Node if greeting ("hi", "hello", "opd", "book", "start")
      if (!matchedNode && (textClean.includes('hi') || textClean.includes('hello') || textClean.includes('start') || textClean.includes('menu'))) {
        matchedNode = nodes.find((n) => n.type === 'trigger' || n.type === 'start' || n.id === 'node-1');
      }

      if (!matchedNode) {
        return { handled: false };
      }

      // Process matched node type and send response to patient via Meta API
      return await this.executeNode(matchedNode, nodes, edges, to, patientBranch, incomingText);
    } catch (err) {
      console.warn('[Flow Processor Error]', err.message);
      return { handled: false };
    }
  }

  async executeNode(node, allNodes, edges, to, patientBranch, originalText) {
    const nodeType = node.type || 'text';
    const data = node.data || {};

    if (nodeType === 'trigger' || nodeType === 'start') {
      // Find connected outgoing next node
      const nextEdge = edges.find((e) => e.source === node.id);
      if (nextEdge) {
        const nextNode = allNodes.find((n) => n.id === nextEdge.target);
        if (nextNode) return await this.executeNode(nextNode, allNodes, edges, to, patientBranch, originalText);
      }
    }

    if (nodeType === 'interactive_menu' || nodeType === 'menu') {
      // Dispatch Meta Interactive List/Button Message
      const buttons = data.buttons || [
        { id: 'btn_opd', title: '🏥 OPD Timings' },
        { id: 'btn_fees', title: '💰 Consultation Fee' },
        { id: 'btn_ai', title: '🤖 Ask AI Assistant' },
      ];

      const result = await sendWithRetry(this.adapter, {
        phoneNumber: to,
        messageType: 'text',
        textContent: `${data.headerText ? `*${data.headerText}*\n\n` : ''}${data.bodyText || 'Please select an option below:'}\n\n${buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n')}`,
      });

      if (result.success) {
        await WhatsAppMessageLog.create({
          phone: to,
          senderName: 'Krishna Flow Bot',
          direction: 'outbound',
          messageText: data.bodyText || 'Interactive menu sent',
          senderType: 'system',
          messageId: result.messageId || '',
          branch: patientBranch,
        });
        return { handled: true, nodeType: 'interactive_menu' };
      }
    }

    if (nodeType === 'ai_agent' || nodeType === 'ai') {
      // Delegate to OpenAI gpt-4o-mini AI Auto-responder
      const aiReply = await generateHospitalAIReply(to, 'Patient', originalText);
      if (aiReply) {
        const result = await sendWithRetry(this.adapter, {
          phoneNumber: to,
          messageType: 'text',
          textContent: aiReply,
        });

        if (result.success) {
          await WhatsAppMessageLog.create({
            phone: to,
            senderName: 'Krishna AI',
            direction: 'outbound',
            messageText: aiReply,
            senderType: 'ai',
            messageId: result.messageId || '',
            branch: patientBranch,
          });
          return { handled: true, nodeType: 'ai_agent' };
        }
      }
    }

    if (nodeType === 'staff_handover' || nodeType === 'reception') {
      const text = data.text || 'Connecting you live with Krishna Hospitals reception staff. An agent will reply here shortly.';
      const result = await sendWithRetry(this.adapter, {
        phoneNumber: to,
        messageType: 'text',
        textContent: text,
      });

      if (result.success) {
        await WhatsAppMessageLog.create({
          phone: to,
          senderName: 'System Router',
          direction: 'outbound',
          messageText: text,
          senderType: 'system',
          messageId: result.messageId || '',
          branch: patientBranch,
        });
        return { handled: true, nodeType: 'staff_handover' };
      }
    }

    // Default text node
    const textMsg = data.bodyText || data.text || 'Thank you for contacting Krishna Hospitals.';
    const result = await sendWithRetry(this.adapter, {
      phoneNumber: to,
      messageType: 'text',
      textContent: textMsg,
    });

    if (result.success) {
      await WhatsAppMessageLog.create({
        phone: to,
        senderName: 'Krishna Flow Bot',
        direction: 'outbound',
        messageText: textMsg,
        senderType: 'system',
        messageId: result.messageId || '',
        branch: patientBranch,
      });
      return { handled: true, nodeType: 'text' };
    }

    return { handled: false };
  }
}
