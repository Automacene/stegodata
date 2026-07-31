import { BaseAdapter } from './base.js';

export class RawAdapter extends BaseAdapter {
  append(fileBuffer, stegoBlockWithFooter) {
    // Guard against ArrayBuffer or ArrayBufferViews missing .length
    const buffer = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);
    const block = stegoBlockWithFooter instanceof Uint8Array ? stegoBlockWithFooter : new Uint8Array(stegoBlockWithFooter);

    const combined = new Uint8Array(buffer.length + block.length);
    combined.set(buffer, 0);
    combined.set(block, buffer.length);
    return combined;
  }
}