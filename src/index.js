import { serializeBlock } from './core/builder.js';
import { parseBlock } from './core/parser.js';
import { readLengthFooter } from './utils/buffer.js';
import { RawAdapter } from './adapters/raw.js';

export class StegoData {
  constructor(adapter = new RawAdapter()) {
    this.adapter = adapter;
  }

  async _toUint8Array(input) {
    if (input instanceof Uint8Array) {
      return input;
    }

    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }

    if (ArrayBuffer.isView(input)) {
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }

    if (input instanceof Blob || input instanceof File) {
      const buffer = await input.arrayBuffer();
      return new Uint8Array(buffer);
    }

    throw new Error('StegoData Error: Unsupported input type. Expected Uint8Array, ArrayBuffer, File, or Blob.');
  }

  async inject(fileInput, { namespace, contentType = 'text/plain', headers = {}, payload }) {
    if (!namespace) {
      throw new Error("StegoData Error: 'namespace' is required.");
    }

    const fileBuffer = await this._toUint8Array(fileInput);
    const blockBytes = serializeBlock({ namespace, contentType, headers, payload });
    return this.adapter.append(fileBuffer, blockBytes);
  }

  async extract(fileInput) {
    const blocks = [];
    let currentBuffer = await this._toUint8Array(fileInput);

    while (currentBuffer.length > 4) {
      const blockLength = readLengthFooter(currentBuffer);
      if (!blockLength || blockLength > currentBuffer.length) {
        break;
      }

      const blockStart = currentBuffer.length - blockLength;
      const blockBytes = currentBuffer.subarray(blockStart, currentBuffer.length - 4);
      const parsed = parseBlock(blockBytes);

      if (!parsed) {
        break;
      }

      blocks.push(parsed);
      currentBuffer = currentBuffer.subarray(0, blockStart);
    }

    return blocks;
  }
}

// Assign directly to window for non-module IIFE browser contexts
if (typeof window !== 'undefined') {
  window.StegoData = StegoData;
  window.StegoDataLib = {
    StegoData,
    serializeBlock,
    parseBlock,
    readLengthFooter,
    RawAdapter
  };
}

export default StegoData;
export { serializeBlock, parseBlock, readLengthFooter, RawAdapter };