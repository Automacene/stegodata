import { serializeBlock } from './core/builder.js';
import { parseBlock } from './core/parser.js';
import { readLengthFooter } from './utils/buffer.js';
import {
  BaseAdapter,
  RawAdapter,
  getAdapter,
  registerAdapter,
  unregisterAdapter
} from './adapters/index.js';

export class StegoData {
  /**
   * @param {BaseAdapter | string} [adapterOrType] - Custom BaseAdapter instance or MIME type/extension string
   */
  constructor(adapterOrType) {
    if (adapterOrType instanceof BaseAdapter) {
      this.adapter = adapterOrType;
    } else {
      this.adapter = getAdapter(adapterOrType);
    }
  }

  async inject(fileInput, { namespace, contentType = 'text/plain', headers = {}, payload, mimeType, filename }) {
    if (!namespace) {
      throw new Error("StegoData Error: 'namespace' is required.");
    }

    // Dynamic resolution if options specify a format context override
    const adapter = (mimeType || filename)
      ? getAdapter(mimeType || filename)
      : this.adapter;

    const fileBuffer = await this._toUint8Array(fileInput);
    const blockBytes = serializeBlock({ namespace, contentType, headers, payload });

    return adapter.inject(fileBuffer, blockBytes);
  }

  async extract(fileInput, options = {}) {
    const adapter = (options.mimeType || options.filename)
      ? getAdapter(options.mimeType || options.filename)
      : this.adapter;

    const fileBuffer = await this._toUint8Array(fileInput);

    // Defer to custom format extraction if implemented by adapter
    const adapterExtracted = adapter.extract(fileBuffer);
    if (adapterExtracted) {
      return adapterExtracted.map((bytes) => parseBlock(bytes)).filter(Boolean);
    }

    // Default: O(1) Reverse-seeking tail parse
    const blocks = [];
    let currentBuffer = fileBuffer;

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

  async _toUint8Array(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);

    if (typeof Blob !== 'undefined' && (input instanceof Blob || input instanceof File)) {
      const buffer = await input.arrayBuffer();
      return new Uint8Array(buffer);
    }

    throw new Error('StegoData Error: Unsupported input type.');
  }
}

// Expose registry controls as static helpers
StegoData.registerAdapter = registerAdapter;
StegoData.getAdapter = getAdapter;
StegoData.unregisterAdapter = unregisterAdapter;

StegoData.inject = (target, options, adapter) => new StegoData(adapter).inject(target, options);
StegoData.extract = (target, options, adapter) => new StegoData(adapter).extract(target, options);

// Browser IIFE Global Bindings (for <script src="stegodata.min.js">)
if (typeof window !== 'undefined') {
  window.StegoData = StegoData;
  window.StegoDataLib = {
    StegoData,
    inject: StegoData.inject,
    extract: StegoData.extract,
    registerAdapter,
    getAdapter,
    unregisterAdapter,
    serializeBlock,
    parseBlock,
    readLengthFooter,
    BaseAdapter,
    RawAdapter
  };
}

export default StegoData;
export {
  BaseAdapter,
  RawAdapter,
  registerAdapter,
  getAdapter,
  unregisterAdapter,
  serializeBlock,
  parseBlock,
  readLengthFooter
};