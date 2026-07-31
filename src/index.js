import { serializeBlock } from './core/builder.js';
import { parseBlock } from './core/parser.js';
import { readLengthFooter } from './utils/buffer.js';
import { RawAdapter } from './adapters/raw.js';

export class StegoData {
  constructor(adapter = new RawAdapter()) {
    this.adapter = adapter;
  }

  inject(fileBuffer, { namespace, contentType = 'text/plain', headers = {}, payload }) {
    if (!namespace) {
      throw new Error("StegoData Error: 'namespace' is required.");
    }

    const blockBytes = serializeBlock({ namespace, contentType, headers, payload });
    return this.adapter.append(fileBuffer, blockBytes);
  }

  extract(fileBuffer) {
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
}

export { serializeBlock, parseBlock, readLengthFooter };
