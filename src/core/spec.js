export const SPEC_VERSION = '1.0';

const encoder = new TextEncoder();

export const MARKERS = {
  BEGIN: encoder.encode('--STEGO-BEGIN--'),
  END: encoder.encode('--STEGO-END--'),
  PAYLOAD_DELIMITER: encoder.encode('===PAYLOAD==='),
};

export const RESERVED_HEADERS = {
  NAMESPACE: 'namespace',
  CONTENT_TYPE: 'content-type',
  SCHEMA: 'schema',
};

export const CUSTOM_HEADER_PREFIX = '+';
export const FOOTER_LENGTH_BYTES = 4;
