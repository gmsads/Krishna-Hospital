export function normalizeInbound(msg) {
  if (!msg || !msg.from || !msg.id || !msg.type) return null;

  const base = {
    from: msg.from,
    messageId: msg.id,
    timestamp: new Date(Number(msg.timestamp) * 1000),
    contentType: 'unsupported',
    text: '',
    reply: msg.context?.id ? { messageId: msg.context.id } : undefined,
    forwarded: msg.context?.forwarded || msg.context?.frequently_forwarded || undefined,
  };

  switch (msg.type) {
    case 'text':
      return { ...base, contentType: 'text', text: msg.text?.body || '' };

    case 'image':
      return {
        ...base,
        contentType: 'image',
        text: msg.image?.caption || '',
        attachment: msg.image && {
          mediaId: msg.image.id,
          mimeType: msg.image.mime_type,
          caption: msg.image.caption,
        },
      };

    case 'document':
      return {
        ...base,
        contentType: 'document',
        text: msg.document?.caption || '',
        attachment: msg.document && {
          mediaId: msg.document.id,
          mimeType: msg.document.mime_type,
          fileName: msg.document.filename,
          caption: msg.document.caption,
        },
      };

    case 'audio':
    case 'voice': {
      const media = msg.type === 'voice' ? msg.voice : msg.audio;
      return {
        ...base,
        contentType: 'audio',
        attachment: media && { mediaId: media.id, mimeType: media.mime_type },
      };
    }

    case 'video':
      return {
        ...base,
        contentType: 'video',
        text: msg.video?.caption || '',
        attachment: msg.video && {
          mediaId: msg.video.id,
          mimeType: msg.video.mime_type,
          caption: msg.video.caption,
        },
      };

    case 'sticker':
      return {
        ...base,
        contentType: 'sticker',
        attachment: msg.sticker && { mediaId: msg.sticker.id, mimeType: msg.sticker.mime_type },
      };

    case 'location':
      return {
        ...base,
        contentType: 'location',
        location: msg.location && {
          latitude: msg.location.latitude,
          longitude: msg.location.longitude,
          name: msg.location.name,
          address: msg.location.address,
        },
      };

    case 'contacts':
      return {
        ...base,
        contentType: 'contact',
        text: (msg.contacts || []).map((c) => c.name?.formatted_name).filter(Boolean).join(', '),
      };

    case 'interactive': {
      const reply = msg.interactive?.button_reply || msg.interactive?.list_reply;
      return {
        ...base,
        contentType: 'interactive',
        text: reply?.title || '',
        buttonId: reply?.id,
      };
    }

    case 'button':
      return {
        ...base,
        contentType: 'interactive',
        text: msg.button?.text || '',
        buttonId: msg.button?.payload,
      };

    case 'reaction':
      return {
        ...base,
        contentType: 'reaction',
        text: msg.reaction?.emoji || '',
        reply: msg.reaction ? { messageId: msg.reaction.message_id } : undefined,
      };

    default:
      return base;
  }
}
