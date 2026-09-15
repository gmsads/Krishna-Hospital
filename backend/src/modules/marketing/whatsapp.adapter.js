import { WHATSAPP_CONFIG } from '../../config/whatsapp.config.js';
import { WhatsAppConfig } from './marketing.model.js';

const NON_RETRYABLE_ERROR_CODES = new Set([
  132000, // Number of parameters does not match expected number of params
  131058, // Template restricted to test numbers
  132001, // Template name does not exist
  132005, // Template hydrated text too long
  132007, // Template format character policy violated
  132012, // Template parameter format mismatch
  132015, // Template is paused
  132016, // Template is disabled
  131009, // Parameter value invalid
  131053, // Media upload error
  131026, // Message undeliverable (recipient not on WhatsApp, blocked, etc.)
  100,    // Invalid parameter (bad JSON, bad phone number)
  190,    // Access token expired or invalid
]);

export class WhatsAppAdapter {
  constructor(baseUrl, accessToken, phoneNumberId) {
    this.baseUrl = baseUrl || WHATSAPP_CONFIG.BASE_URL;
    this.accessToken = accessToken || WHATSAPP_CONFIG.ACCESS_TOKEN;
    this.phoneNumberId = phoneNumberId || WHATSAPP_CONFIG.PHONE_NUMBER_ID;
  }

  async getDynamicCredentials() {
    try {
      const dbConfig = await WhatsAppConfig.findOne({ isConfigured: true }).sort({ updatedAt: -1 });
      if (dbConfig) {
        return {
          accessToken: dbConfig.accessToken || this.accessToken,
          phoneNumberId: dbConfig.phoneNumberId || this.phoneNumberId,
          appSecret: dbConfig.appSecret || WHATSAPP_CONFIG.APP_SECRET,
          defaultTemplate: dbConfig.defaultTemplate || WHATSAPP_CONFIG.DEFAULT_TEMPLATE,
        };
      }
    } catch (err) {
      console.warn('[WhatsAppAdapter] DB config lookup fallback:', err.message);
    }
    return {
      accessToken: this.accessToken,
      phoneNumberId: this.phoneNumberId,
      appSecret: WHATSAPP_CONFIG.APP_SECRET,
      defaultTemplate: WHATSAPP_CONFIG.DEFAULT_TEMPLATE,
    };
  }

  async send(request) {
    if (!request.phoneNumber || !String(request.phoneNumber).trim()) {
      return {
        success: false,
        error: 'Recipient phone number is required',
        retryable: false,
      };
    }

    const { accessToken, phoneNumberId, defaultTemplate } = await this.getDynamicCredentials();
    const tokenToUse = request.accessToken || accessToken;
    const phoneIdToUse = request.phoneNumberId || phoneNumberId;

    if (!tokenToUse || !phoneIdToUse) {
      return {
        success: false,
        error: 'Meta WhatsApp Cloud API credentials missing. Please configure Access Token & Phone Number ID in Marketing Settings.',
        retryable: false,
      };
    }

    try {
      const payload = this.buildPayload(request, defaultTemplate);
      const url = `${this.baseUrl}/${phoneIdToUse}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.error?.code;
        const errorMessage = errorData.error?.message || `HTTP error! status: ${response.status}`;
        const retryable = errorCode === undefined || !NON_RETRYABLE_ERROR_CODES.has(errorCode);
        console.error(`[WhatsApp] Send failed for ${request.phoneNumber} — Code ${errorCode}: ${errorMessage} (retryable=${retryable})`);
        return { success: false, error: errorMessage, errorCode, retryable };
      }

      const data = await response.json();
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WhatsApp] Send threw exception:', message);
      return { success: false, error: message, retryable: true };
    }
  }

  buildPayload(request, fallbackTemplate = 'hello_world') {
    const formattedPhone = this.formatPhoneNumber(request.phoneNumber);
    const message = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: request.messageType || 'template',
    };

    if (request.replyToMessageId && String(request.replyToMessageId).trim()) {
      message.context = { message_id: String(request.replyToMessageId).trim() };
    }

    switch (request.messageType) {
      case 'text': {
        if (!request.textContent) throw new Error('textContent is required for text messages');
        message.text = { body: request.textContent };
        break;
      }

      case 'template': {
        const name = (request.templateName || fallbackTemplate).trim();
        if (!name) throw new Error('templateName is required');
        message.template = {
          name,
          language: { code: request.templateLanguage || 'en_US' },
        };
        const components = [];
        if (request.headerMediaUrl) {
          components.push({
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: { link: request.headerMediaUrl },
              },
            ],
          });
        }
        if (request.templateParameters && request.templateParameters.length > 0) {
          components.push({
            type: 'body',
            parameters: request.templateParameters.map((text) => ({
              type: 'text',
              text: String(text),
            })),
          });
        }
        if (request.buttonParameters && request.buttonParameters.length > 0) {
          components.push(...request.buttonParameters);
        }
        if (components.length > 0) {
          message.template.components = components;
        }
        break;
      }

      case 'interactive': {
        const body = (request.interactiveBody || request.textContent || '').trim();
        const buttons = request.interactiveButtons || [];
        if (!body) throw new Error('interactiveBody is required');
        if (buttons.length < 1 || buttons.length > 3) {
          throw new Error('Interactive button messages require 1 to 3 buttons');
        }
        message.interactive = {
          type: 'button',
          body: { text: body },
          action: {
            buttons: buttons.map((b) => ({
              type: 'reply',
              reply: { id: b.id, title: String(b.title).slice(0, 20) },
            })),
          },
        };
        break;
      }

      case 'image':
      case 'document':
      case 'audio':
      case 'video': {
        if (!request.mediaUrl) throw new Error('mediaUrl is required for media messages');
        message[request.messageType] = {
          link: request.mediaUrl,
          caption: request.mediaCaption,
          filename: request.messageType === 'document' ? request.mediaFilename : undefined,
        };
        break;
      }

      default:
        throw new Error(`Unsupported message type: ${request.messageType}`);
    }

    return message;
  }

  async markMessageAsRead(request) {
    const { accessToken, phoneNumberId } = await this.getDynamicCredentials();
    if (!accessToken || !phoneNumberId) return { success: false, error: 'Credentials missing' };

    try {
      const response = await fetch(`${this.baseUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: request.messageId,
          typing_indicator: { type: 'text' },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown' };
    }
  }

  async downloadMedia(mediaId) {
    const { accessToken } = await this.getDynamicCredentials();
    const metaResp = await fetch(`${this.baseUrl}/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaResp.ok) {
      throw new Error(`WhatsApp media metadata fetch failed: ${metaResp.status}`);
    }
    const meta = await metaResp.json();
    if (!meta.url) throw new Error('WhatsApp media metadata missing url');

    const fileResp = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!fileResp.ok) {
      throw new Error(`WhatsApp media download failed: ${fileResp.status}`);
    }
    const buffer = Buffer.from(await fileResp.arrayBuffer());
    const mimeType = meta.mime_type || fileResp.headers.get('content-type') || 'application/octet-stream';
    return { buffer, mimeType };
  }

  validatePhoneNumber(phoneNumber) {
    return /^\d{10,15}$/.test(String(phoneNumber).replace(/\D/g, ''));
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = String(phoneNumber || '').replace(/\D/g, '');
    const cc = WHATSAPP_CONFIG.DEFAULT_COUNTRY_CODE || '91';
    const doubled = `${cc}${cc}`;
    if (cleaned.length > cc.length * 2 && cleaned.startsWith(doubled)) {
      cleaned = cleaned.substring(cc.length);
    }
    if (cleaned.length === 10) return `${cc}${cleaned}`;
    return cleaned;
  }
}
