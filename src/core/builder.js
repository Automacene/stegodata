import { MARKERS, RESERVED_HEADERS, CUSTOM_HEADER_PREFIX } from './spec.js';
import { writeLengthFooter } from '../utils/buffer.js';

const encoder = new TextEncoder();

function normalizePayload(payload) {
  if (payload instanceof Uint8Array) {
    return new TextDecoder().decode(payload);
  }

  if (payload == null) {
    return '';
  }

  return String(payload);
}

function normalizeHeaders(headers = {}) {
  return Object.entries(headers).reduce((acc, [key, value]) => {
    const normalizedKey = key.startsWith(CUSTOM_HEADER_PREFIX) ? key : `${CUSTOM_HEADER_PREFIX}${key}`;
    acc[normalizedKey] = value;
    return acc;
  }, {});
}

export function serializeBlock({ namespace, contentType = 'text/plain', headers = {}, payload }) {
  if (!namespace) {
    throw new Error("StegoData Error: 'namespace' is required.");
  }

  const customHeaders = normalizeHeaders(headers);
  const headerLines = [
    `${RESERVED_HEADERS.NAMESPACE}: ${namespace}`,
    `${RESERVED_HEADERS.CONTENT_TYPE}: ${contentType}`,
    ...Object.entries(customHeaders).map(([key, value]) => `${key}: ${value}`),
  ];

  const headerSection = headerLines.join('\n');
  const payloadText = normalizePayload(payload);
  const blockText = `${decoder.decode(MARKERS.BEGIN)}\n${headerSection}\n\n===PAYLOAD===\n${payloadText}\n${decoder.decode(MARKERS.END)}`;

  const blockBytes = encoder.encode(blockText);
  return writeLengthFooter(blockBytes);
}

const decoder = new TextDecoder();
