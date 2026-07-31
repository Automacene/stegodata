import { serializeBlock } from './core/builder.js';
import { parseBlock } from './core/parser.js';
import { readLengthFooter } from './utils/buffer.js';
import { RawAdapter } from './adapters/raw.js';

export class StegoData {
  constructor(adapter = new RawAdapter()) {
    this.adapter = adapter;
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

  async encode(target, options) {
    return this.inject(target, options);
  }

  async decode(target) {
    return this.extract(target);
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

}

StegoData.inject = async function inject(target, options) {
  return new StegoData().inject(target, options);
};

StegoData.extract = async function extract(target) {
  return new StegoData().extract(target);
};

StegoData.encode = async function encode(target, options) {
  return StegoData.inject(target, options);
};

StegoData.decode = async function decode(target) {
  return StegoData.extract(target);
};

// Assign directly to window for non-module IIFE browser contexts
if (typeof window !== 'undefined') {
  window.StegoData = StegoData;
  window.StegoDataLib = {
    StegoData,
    inject: StegoData.inject,
    extract: StegoData.extract,
    encode: StegoData.encode,
    decode: StegoData.decode,
    serializeBlock,
    parseBlock,
    readLengthFooter,
    RawAdapter
  };
}

export default StegoData;
export { serializeBlock, parseBlock, readLengthFooter, RawAdapter };