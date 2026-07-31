import { BaseAdapter } from './base.js';

export class RawAdapter extends BaseAdapter {
  inject(fileBuffer, blockBytes) {
    const buffer = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);
    const block = blockBytes instanceof Uint8Array ? blockBytes : new Uint8Array(blockBytes);

    const combined = new Uint8Array(buffer.length + block.length);
    combined.set(buffer, 0);
    combined.set(block, buffer.length);
    return combined;
  }

  strip(fileBuffer) {
    // For raw tail-appended files, stripping logic will be driven 
    // by truncating at the start of the first stego block.
    return fileBuffer;
  }
}