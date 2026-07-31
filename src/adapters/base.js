export class BaseAdapter {
  /**
   * Embeds a serialized stego block into the target file buffer.
   * @param {Uint8Array} fileBuffer 
   * @param {Uint8Array} blockBytes 
   * @returns {Uint8Array}
   */
  inject(fileBuffer, blockBytes) {
    throw new Error('BaseAdapter.inject() must be implemented by a subclass.');
  }

  /**
   * Optional custom extraction logic for non-tail formats.
   * Return null/undefined to let the engine use default $O(1)$ reverse-seeking.
   * @param {Uint8Array} fileBuffer 
   * @returns {Array<Uint8Array> | null}
   */
  extract(fileBuffer) {
    return null;
  }

  /**
   * Removes all stego blocks and returns clean native file bytes.
   * @param {Uint8Array} fileBuffer 
   * @returns {Uint8Array}
   */
  strip(fileBuffer) {
    throw new Error('BaseAdapter.strip() must be implemented by a subclass.');
  }
}