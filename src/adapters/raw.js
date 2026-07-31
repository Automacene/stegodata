import { BaseAdapter } from './base.js';

export class RawAdapter extends BaseAdapter {
  append(fileBuffer, stegoBlockWithFooter) {
    const combined = new Uint8Array(fileBuffer.length + stegoBlockWithFooter.length);
    combined.set(fileBuffer, 0);
    combined.set(stegoBlockWithFooter, fileBuffer.length);
    return combined;
  }
}
