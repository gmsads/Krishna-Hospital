const MAX_WHATSAPP_TEXT_LENGTH = 4000;

export function splitTextForWhatsApp(text, maxLen = MAX_WHATSAPP_TEXT_LENGTH) {
  if (!text) return [];
  if (text.length <= maxLen) return [text];

  const chunks = [];
  let remaining = text;
  let openFence = false;
  const effectiveMax = maxLen - 10;

  while (remaining.length > effectiveMax) {
    const windowStr = remaining.slice(0, effectiveMax);
    const minBreak = Math.floor(effectiveMax * 0.5);

    let breakAt = windowStr.lastIndexOf('\n\n');
    if (breakAt < minBreak) breakAt = windowStr.lastIndexOf('\n');
    if (breakAt < minBreak) breakAt = windowStr.lastIndexOf(' ');
    if (breakAt < minBreak) breakAt = effectiveMax;

    let chunk = remaining.slice(0, breakAt);
    remaining = remaining.slice(breakAt).replace(/^\s+/, '');

    const fences = (chunk.match(/```/g) || []).length;
    const wasOpen = openFence;
    const isOpen = wasOpen !== (fences % 2 === 1);
    if (wasOpen) chunk = '```\n' + chunk;
    if (isOpen) chunk = chunk + '\n```';
    openFence = isOpen;

    chunks.push(chunk);
  }

  if (remaining.length > 0) {
    chunks.push(openFence ? '```\n' + remaining : remaining);
  }

  return chunks;
}
