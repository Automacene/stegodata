import { MARKERS } from './spec.js';

const decoder = new TextDecoder();
const textDecoder = new TextDecoder();

export function parseBlock(blockBytes) {
  if (!(blockBytes instanceof Uint8Array)) {
    blockBytes = new Uint8Array(blockBytes);
  }

  const blockText = textDecoder.decode(blockBytes);
  const beginMarker = decoder.decode(MARKERS.BEGIN);
  const endMarker = decoder.decode(MARKERS.END);
  const payloadDelimiter = decoder.decode(MARKERS.PAYLOAD_DELIMITER);

  if (!blockText.startsWith(beginMarker) || !blockText.endsWith(endMarker)) {
    return null;
  }

  const payloadStart = blockText.indexOf(payloadDelimiter);
  if (payloadStart === -1) {
    return null;
  }

  const headerSection = blockText
    .slice(beginMarker.length, payloadStart)
    .replace(/^\n/, '')
    .trim();

  const payloadSection = blockText.slice(payloadStart + payloadDelimiter.length, blockText.length - endMarker.length);
  const payload = payloadSection.startsWith('\n') ? payloadSection.slice(1) : payloadSection;
  const normalizedPayload = payload.endsWith('\n') ? payload.slice(0, -1) : payload;

  const headers = {};
  for (const line of headerSection.split('\n').filter(Boolean)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    headers[key] = value;
  }

  return {
    headers,
    payload: normalizedPayload,
  };
}
